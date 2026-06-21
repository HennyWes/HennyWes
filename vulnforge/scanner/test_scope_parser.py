import pytest
import json
from scope_parser import ScopeParser

@pytest.fixture
def h1_mock_data():
    return {
        "data": {
            "id": "1",
            "type": "program",
            "attributes": {
                "handle": "acme"
            },
            "relationships": {
                "structured_scopes": {
                    "data": [
                        {"id": "101", "type": "structured-scope"},
                        {"id": "102", "type": "structured-scope"}
                    ]
                },
                "scope_exclusions": {
                    "data": [
                        {"id": "201", "type": "scope-exclusion"}
                    ]
                }
            }
        },
        "included": [
            {
                "id": "101",
                "type": "structured-scope",
                "attributes": {
                    "asset_identifier": "*.example.com",
                    "asset_type": "DOMAIN",
                    "eligible_for_submission": True,
                    "eligible_for_bounty": True
                }
            },
            {
                "id": "102",
                "type": "structured-scope",
                "attributes": {
                    "asset_identifier": "api.example.com/v1",
                    "asset_type": "URL",
                    "eligible_for_submission": True,
                    "eligible_for_bounty": False
                }
            },
            {
                "id": "201",
                "type": "scope-exclusion",
                "attributes": {
                    "category": "Out of scope domain",
                    "details": "dev.example.com is out of scope"
                }
            }
        ]
    }

def test_parse_structured_scopes(h1_mock_data):
    parser = ScopeParser(h1_mock_data)
    result = parser.parse()
    
    assert len(result['allowed_targets']) == 2
    assert result['allowed_targets'][0]['asset_identifier'] == "*.example.com"
    assert result['allowed_targets'][0]['asset_type'] == "DOMAIN"
    assert result['allowed_targets'][1]['asset_identifier'] == "api.example.com/v1"
    assert result['allowed_targets'][1]['asset_type'] == "URL"

def test_parse_scope_exclusions(h1_mock_data):
    parser = ScopeParser(h1_mock_data)
    result = parser.parse()
    
    assert len(result['excluded_targets']) == 1
    assert result['excluded_targets'][0]['category'] == "Out of scope domain"
    assert "dev.example.com" in result['excluded_targets'][0]['details']

def test_get_allowed_domains(h1_mock_data):
    parser = ScopeParser(h1_mock_data)
    parser.parse()
    domains = parser.get_allowed_domains()
    
    assert "*.example.com" in domains
    assert "api.example.com/v1" in domains
    assert len(domains) == 2

def test_get_allowed_urls(h1_mock_data):
    parser = ScopeParser(h1_mock_data)
    parser.parse()
    urls = parser.get_allowed_urls()
    
    assert "api.example.com/v1" in urls
    assert "*.example.com" not in urls
    assert len(urls) == 1

def test_ineligible_for_submission(h1_mock_data):
    # Add an ineligible scope
    h1_mock_data['included'].append({
        "id": "103",
        "type": "structured-scope",
        "attributes": {
            "asset_identifier": "internal.example.com",
            "asset_type": "DOMAIN",
            "eligible_for_submission": False
        }
    })
    h1_mock_data['data']['relationships']['structured_scopes']['data'].append(
        {"id": "103", "type": "structured-scope"}
    )
    
    parser = ScopeParser(h1_mock_data)
    result = parser.parse()
    
    assert len(result['allowed_targets']) == 2
    for target in result['allowed_targets']:
        assert target['asset_identifier'] != "internal.example.com"
