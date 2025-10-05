export default function requestHandler(argv: string[], response: (response: string) => void) {
    const [cmd, arg, ...rest] = argv
    switch (cmd) {
        case 'notification': {

        }
        case 'brightness': {

        }
        case 'volume': {
            
        }
    }
    response("unknown command")
}