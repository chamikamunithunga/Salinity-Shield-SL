import firebase_functions
from firebase_functions import https_fn, options
from firebase_functions.options import SecretParam
from firebase_admin import initialize_app
import requests
from datetime import datetime, timedelta
import json
import os

# Initialize Firebase Admin
initialize_app()

# NASA API Key Secret - will be accessed in the function
# Secret is set via: firebase functions:secrets:set NASA_API_KEY

# CORS configuration for React/Vite dev server
# CorsOptions only accepts cors_origins and cors_methods
CORS_CONFIG = options.CorsOptions(
    cors_origins=["*"],  # Allow all origins
    cors_methods=["GET", "POST", "OPTIONS"]
)

def calculate_risk_level(wse: float, slope: float) -> str:
    """
    Calculate risk level based on WSE and Slope thresholds.
    
    Danger (Red): WSE < 0.3 meters or Slope < 0.00005
    Warning (Yellow): WSE between 0.3 and 0.7 meters
    Safe (Green): WSE > 0.7 meters
    """
    # Check for danger conditions first
    if wse < 0.3 or slope < 0.00005:
        return "Danger"
    
    # Check for warning condition
    if 0.3 <= wse <= 0.7:
        return "Warning"
    
    # Safe condition
    if wse > 0.7:
        return "Safe"
    
    # Fallback (shouldn't reach here)
    return "Unknown"


@https_fn.on_call(
    concurrency=10, 
    cors=CORS_CONFIG,
    secrets=[SecretParam("NASA_API_KEY")]
)
def fetch_hydrology_data(req: https_fn.CallableRequest) -> dict:
    """
    Firebase Cloud Function to fetch hydrology data from NASA Hydrocron API.
    
    Input parameters:
    - reach_id: The Reach ID for the river segment (required)
    
    Returns:
    {
        "current_wse": float,
        "current_slope": float,
        "risk_level": str,
        "timestamp": str (ISO format)
    }
    """
    try:
        # Get reach_id from request data
        # For callable functions, data is accessed via req.data
        reach_id = req.data.get('reach_id') if req.data else None
        
        if not reach_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="Missing required parameter: reach_id",
                details={
                    "current_wse": None,
                    "current_slope": None,
                    "risk_level": "Unknown",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            )
        
        # Validate reach_id is not a placeholder
        if reach_id == "your-reach-id" or reach_id.startswith("your-"):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="Invalid Reach ID: Please provide a valid NASA Reach ID. The placeholder 'your-reach-id' is not valid.",
                details={
                    "current_wse": None,
                    "current_slope": None,
                    "risk_level": "Unknown",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "help": "Find valid Reach IDs from NASA Hydrocron API documentation or use their API explorer"
                }
            )
        
        # Calculate time range (last 7 days for latest data)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=7)
        
        # Format times for NASA API (ISO 8601 format)
        start_time_str = start_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # NASA Hydrocron API URL
        api_url = "https://soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1/timeseries"
        
        # Get NASA API key from secret
        # The secret is declared in the function decorator
        # Access it via environment variable (Firebase automatically injects it)
        nasa_api_key = os.environ.get("NASA_API_KEY", "jDEMQOvw07AElkwigpmoTb2XL0XDnCSQ9HvqbLfl")
        
        # API parameters
        params = {
            "feature": "Reach",
            "feature_id": reach_id,
            "start_time": start_time_str,
            "end_time": end_time_str,
            "output": "json",
            "fields": "wse,slope,time_str"
        }
        
        # API headers with authentication
        headers = {
            "Authorization": f"Bearer {nasa_api_key}",
            "Accept": "application/json"
        }
        
        # Fetch data from NASA API with authentication
        response = requests.get(api_url, params=params, headers=headers, timeout=30)
        
        # Check for HTTP errors and provide detailed error messages BEFORE raise_for_status
        if response.status_code != 200:
            error_detail = f"HTTP {response.status_code}"
            try:
                error_data = response.json()
                if isinstance(error_data, dict):
                    error_detail = error_data.get('message', error_data.get('error', error_data.get('detail', str(error_data))))
                elif isinstance(error_data, str):
                    error_detail = error_data
            except:
                error_detail = response.text[:200] if response.text else f"HTTP {response.status_code} error"
            
            if response.status_code == 400:
                # Provide helpful message for 400 errors (usually invalid Reach ID)
                helpful_msg = "Invalid Reach ID or request parameters. Please verify the Reach ID is correct and valid."
                if reach_id == "your-reach-id" or "your-" in reach_id.lower():
                    helpful_msg = "You are using a placeholder Reach ID. Please update with a valid NASA Reach ID. See NASA_REACH_ID_GUIDE.md for help."
                
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                    message=f"NASA API Bad Request (400): {helpful_msg} Error: {error_detail}",
                    details={
                        "status_code": 400,
                        "error_detail": error_detail,
                        "reach_id_provided": reach_id,
                        "current_wse": None,
                        "current_slope": None,
                        "risk_level": "Unknown",
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "help": "Find valid Reach IDs from NASA Hydrocron API documentation"
                    }
                )
            else:
                # Other HTTP errors
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.INTERNAL,
                    message=f"NASA API HTTP Error ({response.status_code}): {error_detail}",
                    details={
                        "status_code": response.status_code,
                        "error_detail": error_detail,
                        "current_wse": None,
                        "current_slope": None,
                        "risk_level": "Unknown",
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
                )
        
        # If we get here, status is 200, parse the JSON
        api_data = response.json()
        
        # Extract latest WSE and Slope from the response
        # The API returns data in a specific format - adjust based on actual response structure
        current_wse = None
        current_slope = None
        latest_timestamp = None
        
        # Handle different possible response structures
        if isinstance(api_data, dict):
            # Check for time series data
            if "time_series" in api_data:
                time_series = api_data["time_series"]
                if time_series and len(time_series) > 0:
                    # Get the most recent entry
                    latest_entry = time_series[-1]
                    current_wse = latest_entry.get("wse")
                    current_slope = latest_entry.get("slope")
                    latest_timestamp = latest_entry.get("time_str")
            elif "data" in api_data:
                data_list = api_data["data"]
                if data_list and len(data_list) > 0:
                    latest_entry = data_list[-1]
                    current_wse = latest_entry.get("wse")
                    current_slope = latest_entry.get("slope")
                    latest_timestamp = latest_entry.get("time_str")
            else:
                # Try direct access if structure is flat
                current_wse = api_data.get("wse")
                current_slope = api_data.get("slope")
                latest_timestamp = api_data.get("time_str")
        elif isinstance(api_data, list) and len(api_data) > 0:
            # If response is a list, get the last item
            latest_entry = api_data[-1]
            current_wse = latest_entry.get("wse")
            current_slope = latest_entry.get("slope")
            latest_timestamp = latest_entry.get("time_str")
        
        # Validate data
        if current_wse is None or current_slope is None:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="No valid WSE or Slope data found in API response",
                details={
                    "current_wse": None,
                    "current_slope": None,
                    "risk_level": "Unknown",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            )
        
        # Convert to float if they're strings
        try:
            current_wse = float(current_wse)
            current_slope = float(current_slope)
        except (ValueError, TypeError) as e:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INTERNAL,
                message=f"Invalid data format: {str(e)}",
                details={
                    "current_wse": None,
                    "current_slope": None,
                    "risk_level": "Unknown",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            )
        
        # Calculate risk level
        risk_level = calculate_risk_level(current_wse, current_slope)
        
        # Prepare response
        # Callable functions automatically handle CORS and status codes
        return {
            "current_wse": current_wse,
            "current_slope": current_slope,
            "risk_level": risk_level,
            "timestamp": latest_timestamp or datetime.utcnow().isoformat() + "Z"
        }
        
    except requests.exceptions.HTTPError as e:
        # Handle specific HTTP errors from NASA API
        if hasattr(e.response, 'status_code'):
            status_code = e.response.status_code
            error_detail = str(e)
            try:
                error_data = e.response.json()
                if isinstance(error_data, dict):
                    error_detail = error_data.get('message', error_data.get('error', str(error_data)))
            except:
                error_detail = e.response.text[:200] if e.response.text else str(e)
            
            if status_code == 400:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                    message=f"NASA API Bad Request (400): {error_detail}. Please verify the Reach ID is correct and valid.",
                    details={
                        "status_code": 400,
                        "error_detail": error_detail,
                        "current_wse": None,
                        "current_slope": None,
                        "risk_level": "Unknown",
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "help": "Find valid Reach IDs from NASA Hydrocron API documentation"
                    }
                )
            else:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.INTERNAL,
                    message=f"NASA API HTTP Error ({status_code}): {error_detail}",
                    details={
                        "status_code": status_code,
                        "error_detail": error_detail,
                        "current_wse": None,
                        "current_slope": None,
                        "risk_level": "Unknown",
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
                )
        else:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INTERNAL,
                message=f"NASA API request failed: {str(e)}",
                details={
                    "current_wse": None,
                    "current_slope": None,
                    "risk_level": "Unknown",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            )
    
    except requests.exceptions.RequestException as e:
        # Handle other NASA API errors (network, timeout, etc.)
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"NASA API request failed: {str(e)}",
            details={
                "current_wse": None,
                "current_slope": None,
                "risk_level": "Unknown",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )
        
    except KeyError as e:
        # Handle missing keys in API response
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Invalid API response structure: {str(e)}",
            details={
                "current_wse": None,
                "current_slope": None,
                "risk_level": "Unknown",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )
        
    except Exception as e:
        # Handle any other unexpected errors
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Unexpected error: {str(e)}",
            details={
                "current_wse": None,
                "current_slope": None,
                "risk_level": "Unknown",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

