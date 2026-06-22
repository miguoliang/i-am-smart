import XCTest
@testable import ShankaHero

final class SM2EngineTests: XCTestCase {
    func testSuccessfulReviewIncreasesRepetitions() {
        let input = SM2ReviewInput(easeFactor: 2.5, repetitions: 0, intervalDays: 0)
        let result = SM2Engine.review(current: input, quality: 4)

        XCTAssertEqual(result.repetitions, 1)
        XCTAssertEqual(result.intervalDays, SM2Constants.firstInterval)
        XCTAssertGreaterThanOrEqual(result.easeFactor, SM2Constants.minEaseFactor)
    }

    func testFailedReviewResetsRepetitions() {
        let input = SM2ReviewInput(easeFactor: 2.5, repetitions: 3, intervalDays: 10)
        let result = SM2Engine.review(current: input, quality: 1)

        XCTAssertEqual(result.repetitions, 0)
        XCTAssertEqual(result.intervalDays, SM2Constants.firstInterval)
    }

    func testSecondSuccessfulReviewUsesSixDayInterval() {
        let input = SM2ReviewInput(easeFactor: 2.5, repetitions: 1, intervalDays: 1)
        let result = SM2Engine.review(current: input, quality: 4)

        XCTAssertEqual(result.repetitions, 2)
        XCTAssertEqual(result.intervalDays, SM2Constants.secondInterval)
    }

    func testEaseFactorDoesNotFallBelowMinimum() {
        let input = SM2ReviewInput(easeFactor: 1.31, repetitions: 2, intervalDays: 6)
        let result = SM2Engine.review(current: input, quality: 0)

        XCTAssertGreaterThanOrEqual(result.easeFactor, SM2Constants.minEaseFactor)
    }
}
