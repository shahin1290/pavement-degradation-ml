import sys

def error_message(error, detail):
    _, _, exc_tb = detail.exc_info()
    return (
        f"Error occurred in script "
        f"[{exc_tb.tb_frame.f_code.co_filename}] "
        f"line {exc_tb.tb_lineno}: {str(error)}"
    )

class CustomException(Exception):
    def __init__(self, error, detail):
        super().__init__(error_message(error, detail))