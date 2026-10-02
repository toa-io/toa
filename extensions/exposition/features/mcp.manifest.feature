@security
Feature: The icons of an MCP server

  A client that renders a server's icon is given the icons of the application's web manifest,
  which the annotation names. They are read in the background — no request waits for them — and
  only what a client can render with no further trust is shown: an icon of the manifest's own
  origin, meant to be shown as it is, and an image.

  Scenario: The server shows itself by the icons of its manifest
    Given the web manifest:
      """json
      {
        "name": "Teapots, tea at the right temperature",
        "icons": [
          { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
          { "src": "http://localhost:31008/icon-512.png", "sizes": "512x512 huge any", "type": "image/png", "purpose": "monochrome any" },
          { "src": "/icon.svg" },
          { "src": "/mask.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
          { "src": "https://elsewhere.example/icon.png", "sizes": "512x512", "type": "image/png" },
          { "src": "/icon.txt", "type": "text/plain" }
        ]
      }
      """
    And the annotation:
      """yaml
      mcp:
        name: Teapots
        anonymous: true
        manifest: http://localhost:31008/manifest.json
      """
    And the Gateway is running
    And the web manifest has been read
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "initialize",
       "params": {"protocolVersion": "2025-11-25", "capabilities": {},
                  "clientInfo": {"name": "Inspector", "version": "2.5.0"}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 1
      result:
        protocolVersion: '2025-11-25'
        capabilities:
          tools: {}
        serverInfo:
          name: Teapots
          icons:
            - src: http://localhost:31008/icon-192.png
              mimeType: image/png
              sizes:
                - 192x192
            - src: http://localhost:31008/icon-512.png
              mimeType: image/png
              sizes:
                - 512x512
                - any
            - src: http://localhost:31008/icon.svg
      """
    And the reply does not contain:
      """
      mask.png
      """
    And the reply does not contain:
      """
      elsewhere.example
      """
    And the reply does not contain:
      """
      icon.txt
      """
    And the reply does not contain:
      """
      right temperature
      """

  Scenario: A client of the modern revision is shown the same icons
    Given the web manifest:
      """json
      { "icons": [{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }] }
      """
    And the annotation:
      """yaml
      mcp:
        name: Kettles
        anonymous: true
        manifest: http://localhost:31008/manifest.json
      """
    And the Gateway is running
    And the web manifest has been read
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json
      mcp-protocol-version: 2026-07-28
      mcp-method: server/discover

      {"jsonrpc": "2.0", "id": 1, "method": "server/discover",
       "params": {"_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {}}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 1
      result:
        _meta:
          io.modelcontextprotocol/serverInfo:
            name: Kettles
            icons:
              - src: http://localhost:31008/icon-192.png
                mimeType: image/png
                sizes:
                  - 192x192
      """

  Scenario: A manifest that cannot be read leaves the server without icons
    Given the annotation:
      """yaml
      mcp:
        name: Samovars
        anonymous: true
        manifest: http://localhost:31009/manifest.json
      """
    When the following request is received:
      """
      POST /.mcp HTTP/1.1
      host: nex.toa.io
      accept: application/yaml
      content-type: application/json

      {"jsonrpc": "2.0", "id": 1, "method": "initialize",
       "params": {"protocolVersion": "2025-11-25", "capabilities": {},
                  "clientInfo": {"name": "Inspector", "version": "2.5.0"}}}
      """
    Then the following reply is sent:
      """
      200 OK

      jsonrpc: '2.0'
      id: 1
      result:
        serverInfo:
          name: Samovars
      """
    And the reply does not contain:
      """
      icons
      """
