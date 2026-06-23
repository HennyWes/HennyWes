import requests
import re
import json
from typing import List, Dict, Any, Set
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

class ReconEngine:
    """
    Reconnaissance engine for attack surface discovery.
    Enumerates subdomains, discovers live URLs/paths, and extracts parameters.
    """

    def __init__(self, scope: Dict[str, Any]):
        self.scope = scope
        self.allowed_targets = scope.get('allowed_targets', [])
        self.excluded_targets = scope.get('excluded_targets', [])
        
        self.allowed_domains = [t['asset_identifier'] for t in self.allowed_targets if t['asset_type'] == 'DOMAIN']
        self.allowed_urls = [t['asset_identifier'] for t in self.allowed_targets if t['asset_type'] == 'URL']
        
        self.discovered_subdomains: Set[str] = set()
        self.live_targets: Set[str] = set()
        self.attack_surface: List[Dict[str, Any]] = []

    def _is_excluded(self, identifier: str) -> bool:
        """Checks if a domain or URL is in the exclusion list."""
        for exclusion in self.excluded_targets:
            details = exclusion.get('details', '')
            if not details:
                continue
            # Exact match or subdomain match
            if identifier == details or identifier.endswith("." + details):
                return True
        return False

    def enumerate_subdomains(self):
        """
        Enumerates subdomains for the allowed domains in scope.
        Currently uses crt.sh (Certificate Transparency logs).
        """
        for domain in self.allowed_domains:
            clean_domain = domain.lstrip('*.')
            try:
                # Use crt.sh to find subdomains
                url = f"https://crt.sh/?q=%.{clean_domain}&output=json"
                response = requests.get(url, timeout=15)
                if response.status_code == 200:
                    try:
                        data = response.json()
                        for entry in data:
                            name_value = entry.get('name_value', '')
                            for sub in name_value.split('\n'):
                                sub = sub.strip().lower()
                                if sub and not sub.startswith('*'):
                                    if sub.endswith(clean_domain) and not self._is_excluded(sub):
                                        self.discovered_subdomains.add(sub)
                    except json.JSONDecodeError:
                        pass
                
                if not self._is_excluded(clean_domain):
                    self.discovered_subdomains.add(clean_domain)
            except Exception as e:
                print(f"Error enumerating subdomains for {domain}: {e}")

    def discover_live_urls(self):
        """
        Checks which discovered subdomains and URLs are live.
        """
        targets_to_check = set()
        for sub in self.discovered_subdomains:
            targets_to_check.add(f"http://{sub}")
            targets_to_check.add(f"https://{sub}")
        
        for url in self.allowed_urls:
            if self._is_excluded(url):
                continue
            if not url.startswith('http'):
                targets_to_check.add(f"http://{url}")
                targets_to_check.add(f"https://{url}")
            else:
                targets_to_check.add(url)

        for target in targets_to_check:
            try:
                # Use a small timeout and verify it's actually live
                response = requests.head(target, timeout=5, allow_redirects=True)
                if response.status_code < 500:
                    self.live_targets.add(response.url)
            except requests.RequestException:
                continue

    def extract_parameters(self):
        """
        Extracts attack surface points (URLs, methods, params) from live targets.
        """
        processed_urls = set()
        for url in list(self.live_targets):
            if url in processed_urls:
                continue
            processed_urls.add(url)

            try:
                response = requests.get(url, timeout=5)
                if response.status_code != 200:
                    continue
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 1. Extract from forms
                for form in soup.find_all('form'):
                    action = form.get('action')
                    method = form.get('method', 'get').upper()
                    target_url = urljoin(url, action) if action else url
                    
                    if self._is_excluded(target_url):
                        continue

                    params = []
                    for input_tag in form.find_all(['input', 'textarea', 'select']):
                        name = input_tag.get('name')
                        if name:
                            params.append({
                                'name': name,
                                'type': input_tag.get('type', 'text') if input_tag.name == 'input' else input_tag.name,
                                'value': input_tag.get('value', '')
                            })
                    
                    if params:
                        self.attack_surface.append({
                            'url': target_url,
                            'method': method,
                            'params': params,
                            'source': 'form'
                        })

                # 2. Extract from links with query params
                for link in soup.find_all('a'):
                    href = link.get('href')
                    if href:
                        full_url = urljoin(url, href)
                        if self._is_excluded(full_url):
                            continue
                            
                        parsed = urlparse(full_url)
                        if parsed.query:
                            query_params = []
                            # Basic query param parsing
                            for p in parsed.query.split('&'):
                                if '=' in p:
                                    parts = p.split('=', 1)
                                    query_params.append({'name': parts[0], 'value': parts[1], 'type': 'query'})
                                else:
                                    query_params.append({'name': p, 'value': '', 'type': 'query'})
                            
                            self.attack_surface.append({
                                'url': full_url.split('?')[0],
                                'method': 'GET',
                                'params': query_params,
                                'source': 'link'
                            })

            except Exception as e:
                print(f"Error extracting parameters from {url}: {e}")

    def run(self) -> List[Dict[str, Any]]:
        """Executes the full recon pipeline."""
        print(f"Starting subdomain enumeration for domains: {self.allowed_domains}")
        self.enumerate_subdomains()
        print(f"Discovered {len(self.discovered_subdomains)} subdomains.")
        
        print("Discovering live targets...")
        self.discover_live_urls()
        print(f"Found {len(self.live_targets)} live targets.")
        
        print("Extracting parameters...")
        self.extract_parameters()
        print(f"Extracted {len(self.attack_surface)} attack surface points.")
        
        return self.attack_surface

if __name__ == "__main__":
    # Example usage
    mock_scope = {
        'allowed_targets': [
            {'asset_identifier': 'example.com', 'asset_type': 'DOMAIN'},
            {'asset_identifier': 'https://httpbin.org/get', 'asset_type': 'URL'}
        ],
        'excluded_targets': [
            {'details': 'exclude.example.com'}
        ]
    }
    engine = ReconEngine(mock_scope)
    # surface = engine.run()
    # print(json.dumps(surface, indent=2))
