"""
日语学习助手 — CORS 代理

使用 DeepSeek API 进行翻译（新用户有免费额度）。
因为浏览器 CORS 限制，需要这个本地代理转发请求。

使用: python3 proxy.py
默认端口: 3001
"""

import http.server
import json
import urllib.request
import os

PORT = int(os.environ.get('PORT', 3001))
DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'


class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        """健康检查 + CORS 预检"""
        self.send_response(200)
        self._send_cors()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'ok', 'service': 'DeepSeek'}).encode())

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        api_key = self.headers.get('x-api-key', '')

        req = urllib.request.Request(
            DEEPSEEK_URL,
            data=body,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(req) as resp:
                response_body = resp.read()
                self.send_response(resp.status)
                self._send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_body)
        except urllib.error.HTTPError as e:
            error_body = e.read()
            self.send_response(e.code)
            self._send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(error_body)
        except Exception as e:
            self.send_response(502)
            self._send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': f'代理请求失败: {str(e)}'
            }).encode())

    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
        self.send_header('Access-Control-Max-Age', '86400')

    def log_message(self, format, *args):
        if 'POST' in str(args):
            print(f'  → 翻译请求已转发')
        elif 'GET' in str(args):
            print(f'  → 健康检查')
        elif 'OPTIONS' not in str(args):
            print(f'  {args[0]}')


if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), ProxyHandler)
    print(f'🎌 日语学习助手 — 代理已启动（DeepSeek）')
    print(f'   地址: http://localhost:{PORT}')
    print(f'   按 Ctrl+C 停止代理')
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n代理已停止')
        server.server_close()
