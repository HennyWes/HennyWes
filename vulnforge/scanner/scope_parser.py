import json
import requests
from typing import Dict, List, Any, Optional

class ScopeParser:
    """
    Parses HackerOne program scope rules and extracts allowed and excluded targets.
    Handles JSON:API format typically returned by HackerOne API.
    """

    def __init__(self, config_data: Optional[Dict[str, Any]] = None):
        self.config_data = config_data
        self.structured_scopes = []
        self.scope_exclusions = []

    def load_from_file(self, file_path: str):
        """Loads scope configuration from a JSON file."""
        with open(file_path, 'r') as f:
            self.config_data = json.load(f)

    def load_from_url(self, url: str):
        """Loads scope configuration from a URL."""
        response = requests.get(url)
        response.raise_for_status()
        self.config_data = response.json()

    def parse(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Parses the loaded config data and returns a structured scope definition.
        """
        if not self.config_data:
            raise ValueError("No configuration data loaded.")

        # In JSON:API, related objects are often in the 'included' list
        included_objects = self.config_data.get('included', [])
        
        # Build a map for easy lookup of included objects
        included_map = {}
        for obj in included_objects:
            obj_type = obj.get('type')
            obj_id = obj.get('id')
            if obj_type and obj_id:
                included_map[(obj_type, obj_id)] = obj

        # Find the program object (it could be in 'data' or 'included')
        program_obj = None
        data = self.config_data.get('data')
        if isinstance(data, dict) and data.get('type') == 'program':
            program_obj = data
        elif isinstance(data, list):
            for item in data:
                if item.get('type') == 'program':
                    program_obj = item
                    break
        
        # If we can't find a program object, we might just have a list of scopes in 'data'
        if not program_obj and isinstance(data, list):
            scopes_data = [item for item in data if item.get('type') == 'structured-scope']
            exclusions_data = [item for item in data if item.get('type') == 'scope-exclusion']
        else:
            # Extract structured scopes from program relationships or included map
            scopes_data = []
            if program_obj:
                rel_scopes = program_obj.get('relationships', {}).get('structured_scopes', {}).get('data', [])
                for rel in rel_scopes:
                    obj = included_map.get((rel.get('type'), rel.get('id')))
                    if obj:
                        scopes_data.append(obj)
            
            # Extract scope exclusions
            exclusions_data = []
            if program_obj:
                rel_excl = program_obj.get('relationships', {}).get('scope_exclusions', {}).get('data', [])
                for rel in rel_excl:
                    obj = included_map.get((rel.get('type'), rel.get('id')))
                    if obj:
                        exclusions_data.append(obj)

        self.structured_scopes = []
        for scope in scopes_data:
            attributes = scope.get('attributes', {})
            # Only include if it's eligible for submission (HackerOne standard)
            if attributes.get('eligible_for_submission', True):
                self.structured_scopes.append({
                    'id': scope.get('id'),
                    'asset_identifier': attributes.get('asset_identifier'),
                    'asset_type': attributes.get('asset_type'),
                    'eligible_for_bounty': attributes.get('eligible_for_bounty', False),
                    'max_severity': attributes.get('max_severity'),
                    'instruction': attributes.get('instruction')
                })

        self.scope_exclusions = []
        for exclusion in exclusions_data:
            attributes = exclusion.get('attributes', {})
            self.scope_exclusions.append({
                'id': exclusion.get('id'),
                'category': attributes.get('category'),
                'details': attributes.get('details')
            })

        return {
            'allowed_targets': self.structured_scopes,
            'excluded_targets': self.scope_exclusions
        }

    def get_allowed_domains(self) -> List[str]:
        """Returns a list of allowed domain names (identifier)."""
        return [s['asset_identifier'] for s in self.structured_scopes if s['asset_type'] in ['DOMAIN', 'URL']]

    def get_allowed_urls(self) -> List[str]:
        """Returns a list of allowed URLs."""
        return [s['asset_identifier'] for s in self.structured_scopes if s['asset_type'] == 'URL']
