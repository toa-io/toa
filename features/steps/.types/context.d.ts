declare namespace toa.features {
    type Context = {
        cwd?: string
        stdout?: string
        stderr?: string
        stdoutLines?: string[]
        stderrLines?: string[]
    }
}
