import pytest
import requests_mock
from recon_engine import ReconEngine

@pytest.fixture
def mock_scope():
    return {
        'allowed_targets': [
            {'asset_identifier': 'example.com', 'asset_type': 'DOMAIN'},
            {'asset_identifier': 'https://api.example.com/v1', 'asset_type': 'URL'}
        ],
        'excluded_targets': [
            {'details': 'exclude.example.com'}
        ]
    }

def test_init(mock_scope):
    engine = ReconEngine(mock_scope)
    assert 'example.com' in engine.allowed_domains
    assert 'https://api.example.com/v1' in engine.allowed_urls

def test_is_excluded(mock_scope):
    engine = ReconEngine(mock_scope)
    assert engine._is_excluded('exclude.example.com') is True
    assert engine._is_excluded('sub.example.com') is False

def test_enumerate_subdomains(mock_scope):
    engine = ReconEngine(mock_scope)
    
    with requests_mock.Mocker() as m:
        # Mock crt.sh response
        crt_data = [
            {'name_value': 'www.example.com\napi.example.com'},
            {'name_value': 'exclude.example.com'},
            {'name_value': '*.example.com'}
        ]
        m.get('https://crt.sh/?q=%.example.com&output=json', json=crt_data)
        
        engine.enumerate_subdomains()
        
        assert 'www.example.com' in engine.discovered_subdomains
        assert 'api.example.com' in engine.discovered_subdomains
        assert 'example.com' in engine.discovered_subdomains
        assert 'exclude.example.com' not in engine.discovered_subdomains
        assert '*.example.com' not in engine.discovered_subdomains

def test_discover_live_urls(mock_scope):
    engine = ReconEngine(mock_scope)
    engine.discovered_subdomains = {'www.example.com'}
    
    with requests_mock.Mocker() as m:
        # Mock liveness checks
        m.head('http://www.example.com', status_code=301, headers={'Location': 'https://www.example.com'})
        m.head('https://www.example.com', status_code=200)
        m.head('http://api.example.com/v1', status_code=404) # Not live or error
        m.head('https://api.example.com/v1', status_code=200)
        
        engine.discover_live_urls()
        
        assert 'https://www.example.com' in engine.live_targets
        assert 'https://api.example.com/v1' in engine.live_targets

def test_extract_parameters(mock_scope):
    engine = ReconEngine(mock_scope)
    engine.live_targets = {'https://www.example.com'}
    
    html_content = """
    <html>
        <body>
            <form action="/login" method="POST">
                <input type="text" name="username" value="admin">
                <input type="password" name="password">
                <input type="hidden" name="csrf" value="token123">
            </form>
            <a href="/search?q=test&category=books">Search</a>
            <a href="https://other.com/out">External</a>
        </body>
    </html>
    """
    
    with requests_mock.Mocker() as m:
        m.get('https://www.example.com', text=html_content)
        
        engine.extract_parameters()
        
        # Verify form extraction
        form_entry = next(item for item in engine.attack_surface if item['source'] == 'form')
        assert form_entry['url'] == 'https://www.example.com/login'
        assert form_entry['method'] == 'POST'
        assert len(form_entry['params']) == 3
        assert any(p['name'] == 'username' for p in form_entry['params'])
        
        # Verify link extraction
        link_entry = next(item for item in engine.attack_surface if item['source'] == 'link')
        assert link_entry['url'] == 'https://www.example.com/search'
        assert any(p['name'] == 'q' and p['value'] == 'test' for p in link_entry['params'])
        assert any(p['name'] == 'category' and p['value'] == 'books' for p in link_entry['params'])
