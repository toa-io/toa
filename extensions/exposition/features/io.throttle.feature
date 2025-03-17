Feature: Request throttling

  Scenario: Throttle requests
    Given the `echo` is running with the following manifest:
      """yaml
      exposition:
        /:
          GET:
            io:throttle:
             key: [ip, method, path, :x-real-ip]
            endpoint: echo
      """
