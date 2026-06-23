import os
from jinja2 import Environment, FileSystemLoader

class ReportGenerator:
    def __init__(self, template_dir='../reports/templates', output_dir='../reports/output'):
        # Get absolute path to the scanner directory
        scanner_dir = os.path.dirname(os.path.abspath(__file__))
        
        self.template_dir = os.path.abspath(os.path.join(scanner_dir, template_dir))
        self.output_dir = os.path.abspath(os.path.join(scanner_dir, output_dir))
        self.env = Environment(loader=FileSystemLoader(self.template_dir))

        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir, exist_ok=True)

    def generate_report(self, vuln_data, template_name='base.md'):
        """
        Generates a markdown report based on vulnerability data.
        """
        try:
            template = self.env.get_template(template_name)
            report_content = template.render(**vuln_data)
            
            # Create a filename based on the program and vulnerability type
            program_slug = vuln_data.get('program_name', 'unknown').lower().replace(' ', '-')
            vuln_slug = vuln_data.get('vuln_class', 'vulnerability').lower().replace(' ', '-')
            filename = f"{program_slug}_{vuln_slug}_{os.urandom(4).hex()}.md"
            
            output_path = os.path.join(self.output_dir, filename)
            
            with open(output_path, 'w') as f:
                f.write(report_content)
            
            return output_path
        except Exception as e:
            print(f"Error generating report: {e}")
            return None

if __name__ == "__main__":
    # Example usage for testing
    generator = ReportGenerator()
    
    # Test XSS
    xss_data = {
        "severity": "High",
        "title": "Reflected XSS on example.com",
        "program_name": "Example Bug Bounty",
        "vuln_class": "Reflected Cross-Site Scripting (XSS)",
        "affected_url": "https://example.com/search",
        "affected_param": "q",
        "summary": "The 'q' parameter is vulnerable to reflected XSS.",
        "reproduction_steps": "1. Go to https://example.com/search?q=<script>alert(1)</script>",
        "poc_url": "https://example.com/search?q=<script>alert(1)</script>",
        "alert_text": "1",
        "payload": "<script>alert(1)</script>",
        "request_dump": "GET /search?q=<script>alert(1)</script> HTTP/1.1\nHost: example.com",
        "response_snippet": "<div>Search results for: <script>alert(1)</script></div>",
        "impact": "Session hijacking, credential theft.",
        "remediation": "Implement proper output encoding."
    }
    path1 = generator.generate_report(xss_data, 'xss.md')
    print(f"XSS report generated at: {path1}")

    # Test SQLi
    sqli_data = {
        "severity": "Critical",
        "title": "Time-based SQL Injection on example.com",
        "program_name": "Example Bug Bounty",
        "vuln_class": "SQL Injection (SQLi)",
        "affected_url": "https://example.com/products",
        "affected_param": "id",
        "summary": "The 'id' parameter is vulnerable to time-based SQL injection.",
        "reproduction_steps": "1. Send the following request...",
        "poc_url": "https://example.com/products?id=1' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--",
        "delay_seconds": "5",
        "payload": "1' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--",
        "request_dump": "GET /products?id=1'%20AND%20(SELECT%201%20FROM%20(SELECT(SLEEP(5)))a)-- HTTP/1.1\nHost: example.com",
        "response_details": "The server took 5.2 seconds to respond.",
        "impact": "Full database compromise.",
        "remediation": "Use parameterized queries."
    }
    path2 = generator.generate_report(sqli_data, 'sqli.md')
    print(f"SQLi report generated at: {path2}")
