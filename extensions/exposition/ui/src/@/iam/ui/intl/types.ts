/**
 * Auto-generated TypeScript definitions for i18n dictionaries
 *
 * @author copilot
 */

export type Dictionary = {
      auth: {
        signupTitle: string
        passwordTitle: string
        passwordDescription: string
        passkey: string
        email: string
        alreadyHaveAccount: string
        betterSecurity: string
        passkeysNotSupported: string
        passkeysWarning: string
        learnMore: string
        passwordBlank: string
        otpInstructions: string
        continueWith: (value: any) => string
        passkeysDescription: string
        yourName: string
        password: string
        refresh: {
          description: (value: any) => string
          title: string
          continue: string
        }
        signout: string
        login: string
        signin: string
        copyId: string
      }
      credentials: {
        connect: string
        email: {
          title: string
          description: string
        }
        google: {
          title: string
          description: string
        }
        apple: {
          title: string
          description: string
        }
        passkeys: {
          title: string
          tagline: string
          create: string
          manage: string
          collapse: string
          add: string
          delete: string
          unknown: string
          count: (value: number) => string
          meta: (...args: [any, any]) => string
          duplicate: string
          failed: string
        }
        transfer: {
          action: string
          title: string
          description: string
          done: string
        }
      }
    }
