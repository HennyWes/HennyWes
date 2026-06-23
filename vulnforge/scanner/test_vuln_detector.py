import pytest
import requests_mock
import time
from vuln_detector import VulnDetector

def test_check_xss():
    mock_surface = [
        {
            'url': 'http://example.com/search',
            'method': 'GET',
            'params': [{'name': 'q', 'value': '', 'type': 'query'}],
            'source': 'link'
        }
    ]
    detector = VulnDetector(mock_surface)
    payload = "<script>alert('VulnForge-XSS')</script>"
    
    with requests_mock.Mocker() as m:
        # Mock positive finding
        m.get('http://example.com/search?q=' + payload, text=f"Search results for {payload}")
        detector.check_xss(mock_surface[0])
        
        assert len(detector.findings) == 1
        assert detector.findings[0]['type'] == 'XSS'

def test_check_sqli_time():
    mock_surface = [
        {
            'url': 'http://example.com/item',
            'method': 'GET',
            'params': [{'name': 'id', 'value': '1', 'type': 'query'}],
            'source': 'link'
        }
    ]
    detector = VulnDetector(mock_surface)
    
    # We can't easily mock timing in requests_mock without a custom response callback
    # but we can test the logic flow.
    
    def slow_response(request, context):
        time.sleep(5)
        return "Done"

    with requests_mock.Mocker() as m:
        m.get('http://example.com/item', text=slow_response)
        detector.check_sqli_time(mock_surface[0])
        
        assert len(detector.findings) == 1
        assert detector.findings[0]['type'] == 'SQLi (Time-based)'

def test_check_ssrf():
    mock_surface = [
        {
            'url': 'http://example.com/proxy',
            'method': 'GET',
            'params': [{'name': 'url', 'value': '', 'type': 'query'}],
            'source': 'link'
        }
    ]
    detector = VulnDetector(mock_surface)
    callback_domain = "vulnforge-ssrf.free.beeceptor.com"
    
    with requests_mock.Mocker() as m:
        m.get('http://example.com/proxy', text=f"Fetched content from {callback_domain}")
        detector.check_ssrf(mock_surface[0])
        
        assert len(detector.findings) == 1
        assert detector.findings[0]['type'] == 'SSRF (Potential)'

def test_check_idor():
    mock_surface = [
        {
            'url': 'http://example.com/api/user',
            'method': 'GET',
            'params': [{'name': 'user_id', 'value': '100', 'type': 'query'}],
            'source': 'link'
        }
    ]
    detector = VulnDetector(mock_surface)
    
    with requests_mock.Mocker() as m:
        m.get('http://example.com/api/user', status_code=200)
        detector.check_idor(mock_surface[0])
        
        assert len(detector.findings) == 1
        assert detector.findings[0]['type'] == 'IDOR (Potential)'
        assert detector.findings[0]['tampered_value'] == '101'
