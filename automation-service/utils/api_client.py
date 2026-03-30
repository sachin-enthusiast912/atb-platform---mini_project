import requests
import logging
from config.settings import Config

logger = logging.getLogger(__name__)

class APIClient:
    """Client for communicating with the backend API"""
    
    def __init__(self):
        self.base_url = Config.BACKEND_API_URL
        self.headers = {
            'Content-Type': 'application/json'
        }
    
    def get_test_case(self, test_case_id):
        """Get test case details from backend"""
        try:
            url = f"{self.base_url}/api/testcases/{test_case_id}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                logger.info(f"Retrieved test case: {test_case_id}")
                return data.get('testCase')
            else:
                logger.error(f"Failed to get test case: {data.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching test case: {str(e)}")
            return None
    
    def update_execution(self, execution_id, status, error_message=None, screenshot=None, duration=0):
        """Update execution status in backend"""
        try:
            url = f"{self.base_url}/api/executions/{execution_id}"
            
            payload = {
                'status': status,
                'duration': duration
            }
            
            if error_message:
                payload['errorMessage'] = error_message
            
            if screenshot:
                payload['screenshot'] = screenshot
            
            response = requests.put(url, json=payload, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                logger.info(f"Updated execution {execution_id}: {status}")
                return True
            else:
                logger.error(f"Failed to update execution: {data.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating execution: {str(e)}")
            return False
    
    def create_bug(self, title, description, test_case_id, execution_id, screenshot=None):
        """Create a bug in the backend"""
        try:
            url = f"{self.base_url}/api/bugs"
            
            payload = {
                'title': title,
                'description': description,
                'priority': 'High',
                'severity': 'Major',
                'type': 'Functional',
                'testCaseId': test_case_id,
                'executionId': execution_id,
                'isAutomated': True,
                'environment': 'Automation',
                'sendNotification': True
            }
            
            if screenshot:
                payload['attachments'] = [{
                    'filename': screenshot.split('/')[-1],
                    'url': screenshot,
                    'type': 'screenshot'
                }]
            
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                bug_id = data.get('bug', {}).get('_id')
                logger.info(f"Created bug: {bug_id}")
                return bug_id
            else:
                logger.error(f"Failed to create bug: {data.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating bug: {str(e)}")
            return None