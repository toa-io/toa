import { binding, given, then } from 'cucumber-tsflow'

@binding()
export class ArithmeticSteps {
  private computedResult: number = 0

  @given(/I enter '(\d*)' and '(\d*)'/)
  public givenTwoNumbers (num1: string, num2: string): void {
    this.computedResult = parseInt(num1) + parseInt(num2)
  }

  @then(/I receive the result '(\d*)'/)
  public thenResultReceived (expectedResult: string): void {
    if (parseInt(expectedResult) !== this.computedResult)
      throw new Error('Arithmetic Error')
  }

  @given('Ok {word}')
  public okay (word: string): void {

  }
}
