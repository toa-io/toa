declare namespace toa.operations {

    interface Process {
        execute(cmd: string, args: Array<string>): Promise<void>
    }
    
}
