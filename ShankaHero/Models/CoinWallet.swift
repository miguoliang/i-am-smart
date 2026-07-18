import Foundation
import SwiftData

@Model
final class CoinWallet {
    static let singletonID = "coin-wallet"

    @Attribute(.unique) var id: String
    var balance: Int

    init(id: String = CoinWallet.singletonID, balance: Int = 0) {
        self.id = id
        self.balance = balance
    }
}
