export const getUserWallet = (user) => ({
  balance: user?.wallet?.balance ?? 0,
  available: user?.wallet?.availableBalance ?? 0,
  exposure: user?.wallet?.exposure ?? 0,
  bonus: user?.wallet?.bonusBalance ?? 0,
});

export const getUserPermissions = (user) => ({
  canDeposit: user?.permissions?.canDeposit ?? false,
  canWithdraw: user?.permissions?.canWithdraw ?? false,
  canBet: user?.permissions?.canBet ?? false,
});
