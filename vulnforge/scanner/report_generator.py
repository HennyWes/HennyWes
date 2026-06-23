import os
from jinja2 import Environment, FileSystemLoader

class ReportGenerator:
    def __init__(self, template_dir='../reports/templates', output_dir='../reports'):
        self.template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), template_dir))
        self.output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), output_dir))
        self.env = Environment(loader=FileSystemLoader(self.template_dir))

        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

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
    test_data = {
        "severity": "High",
        "title": "Reflected XSS on example.com",
        "program_name": "Example Bug Bounty",
        "vuln_class": "Reflected Cross-Site Scripting (XSS)",
        "affected_url": "https://example.com/search",
        "affected_param": "q",
        "summary": "The 'q' parameter is vulnerable to reflected XSS.",
        "reproduction_steps": "1. Go to https://example.com/search?q=<script>alert(1)</script>",
        "poc_details": "Triggered an alert box in the browser.",
        "impact": "Session hijacking, credential theft.",
        "remediation": "Implement proper output encoding."
    }
    report_path = generator.generate_report(test_data)
    print(f"Test report generated at: {report_path}")
