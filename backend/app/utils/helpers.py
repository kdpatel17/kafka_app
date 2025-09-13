import subprocess
import os


def run_script(script_name: str):
    script_path = os.path.join(os.path.dirname(__file__), f"../../{script_name}")
    try:
        result = subprocess.run(script_path, check=True, shell=True, capture_output=True, text=True)
        return {"status": "success", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "output": e.stderr}
