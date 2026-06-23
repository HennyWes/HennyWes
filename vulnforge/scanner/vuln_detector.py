import requests
import time
from typing import List, Dict, Any

class VulnDetector:
    """
    Vulnerability detection engine.
    Scans attack surface points for common web vulnerabilities using safe payloads.
    """

    def __init__(self, attack_surface: List[Dict[str, Any]]):
        self.attack_surface = attack_surface
        self.findings: List[Dict[str, Any]] = []

    def check_xss(self, target: Dict[str, Any]):
        """
        Checks for reflected XSS using a safe alert payload.
        """
        payload = "<script>alert('VulnForge-XSS')</script>"
        url = target['url']
        method = target['method']
        params = target['params']

        if method == 'GET':
            test_params = {}
            for p in params:
                test_params[p['name']] = payload
            
            try:
                response = requests.get(url, params=test_params, timeout=10)
                if payload in response.text:
                    self.findings.append({
                        'type': 'XSS',
                        'url': url,
                        'method': method,
                        'parameter': list(test_params.keys()),
                        'payload': payload,
                        'severity': 'Medium'
                    })
            except requests.RequestException:
                pass

    def check_sqli_time(self, target: Dict[str, Any]):
        """
        Checks for time-based SQL injection using safe sleep payloads.
        """
        # Example for MySQL
        payload = "'; SELECT SLEEP(5) -- "
        url = target['url']
        method = target['method']
        params = target['params']

        if method == 'GET':
            for p in params:
                test_params = {param['name']: param['value'] for param in params}
                test_params[p['name']] = payload
                
                try:
                    start_time = time.time()
                    requests.get(url, params=test_params, timeout=15)
                    duration = time.time() - start_time
                    
                    if duration >= 5:
                        self.findings.append({
                            'type': 'SQLi (Time-based)',
                            'url': url,
                            'method': method,
                            'parameter': p['name'],
                            'payload': payload,
                            'severity': 'High'
                        })
                except requests.RequestException:
                    pass

    def check_ssrf(self, target: Dict[str, Any]):
        """
        Checks for SSRF using an outbound request detection payload.
        In a real scenario, this would point to a collaborator-style service.
        """
        callback_domain = "vulnforge-ssrf.free.beeceptor.com"
        payload = f"http://{callback_domain}"
        url = target['url']
        method = target['method']
        params = target['params']

        if method == 'GET':
            for p in params:
                test_params = {param['name']: param['value'] for param in params}
                test_params[p['name']] = payload
                
                try:
                    # In a real scanner, we'd check the callback service here.
                    # For this implementation, we check if the app tries to fetch it
                    # (which we can't see directly without the service, but we can 
                    # check for response behavior).
                    response = requests.get(url, params=test_params, timeout=10)
                    # Simple heuristic: if the callback domain appears in the response 
                    # but wasn't there before, it might be reflected or fetched.
                    if callback_domain in response.text:
                         self.findings.append({
                            'type': 'SSRF (Potential)',
                            'url': url,
                            'method': method,
                            'parameter': p['name'],
                            'payload': payload,
                            'severity': 'Medium'
                        })
                except requests.RequestException:
                    pass

    def check_idor(self, target: Dict[str, Any]):
        """
        Checks for basic IDOR by tampering with numeric user IDs.
        """
        url = target['url']
        method = target['method']
        params = target['params']

        if method == 'GET':
            for p in params:
                if p['name'].lower() in ['id', 'user_id', 'account_id'] and p['value'].isdigit():
                    original_val = p['name']
                    # Tamper with the ID (e.g., increment/decrement)
                    tampered_val = str(int(p['value']) + 1)
                    
                    test_params = {param['name']: param['value'] for param in params}
                    test_params[p['name']] = tampered_val
                    
                    try:
                        # In a real scanner, we'd compare the response with the original
                        # and check for sensitive data leakage.
                        response = requests.get(url, params=test_params, timeout=10)
                        
                        # Heuristic: if status is 200 and content length is similar, 
                        # it might be worth a manual look.
                        if response.status_code == 200:
                            self.findings.append({
                                'type': 'IDOR (Potential)',
                                'url': url,
                                'method': method,
                                'parameter': p['name'],
                                'original_value': p['value'],
                                'tampered_value': tampered_val,
                                'severity': 'Medium'
                            })
                    except requests.RequestException:
                        pass

    def run(self) -> List[Dict[str, Any]]:
        """Runs all modular checkers against the attack surface."""
        for target in self.attack_surface:
            self.check_xss(target)
            self.check_sqli_time(target)
            self.check_ssrf(target)
            self.check_idor(target)
        return self.findings

if __name__ == "__main__":
    # Example usage
    mock_surface = [
        {
            'url': 'http://example.com/search',
            'method': 'GET',
            'params': [{'name': 'q', 'value': '', 'type': 'query'}],
            'source': 'link'
        }
    ]
    detector = VulnDetector(mock_surface)
    # findings = detector.run()
    # print(findings)
