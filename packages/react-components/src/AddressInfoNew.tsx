// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { TFunction } from "i18next";
import type {
  DeriveBalancesAccountData,
  DeriveBalancesAll,
  DeriveDemocracyLock,
  DeriveStakingAccount,
} from "@polkadot/api-derive/types";
import type { BlockNumber, ValidatorPrefsTo145 } from "@polkadot/types/interfaces";

import BN from "bn.js";
import React, { useRef } from "react";
import styled from "styled-components";

import { withCalls, withMulti } from "@polkadot/react-api/hoc";
import { Expander } from "@polkadot/react-components";
import { useBestNumber } from "@polkadot/react-hooks";
import {  FormatBalance, FormatBalancenew } from "@polkadot/react-query";
import { BN_ZERO, formatNumber, isObject } from "@polkadot/util";

import CryptoType from "./CryptoType";
import Label from "./Label";
import { useTranslation } from "./translate";

// true to display, or (for bonded) provided values [own, ...all extras]
export interface BalanceActiveType {
  available?: boolean;
  bonded?: boolean | BN[];
  extraInfo?: [React.ReactNode, React.ReactNode][];
  locked?: boolean;
  redeemable?: boolean;
  reserved?: boolean;
  total?: boolean;
  unlocking?: boolean;
  vested?: boolean;
}

export interface CryptoActiveType {
  crypto?: boolean;
  nonce?: boolean;
}

export interface ValidatorPrefsType {
  unstakeThreshold?: boolean;
  validatorPayment?: boolean;
}

export interface DlcBalances {
  balance: BN;
  isFrozen: boolean;
  isSufficient: boolean;
}

interface Props {
  address: string;
  balancesAll?: DeriveBalancesAll;
  dlcBalances?: DlcBalances;
  dlcBalancesLocks: BN;
  children?: React.ReactNode;
  className?: string;
  democracyLocks?: DeriveDemocracyLock[];
  extraInfo?: [string, string][];
  stakingInfo?: DeriveStakingAccount;
  withBalance?: boolean | BalanceActiveType;
  withBalanceToggle?: false;
  withExtended?: boolean | CryptoActiveType;
  withHexSessionId?: (string | null)[];
  withValidatorPrefs?: boolean | ValidatorPrefsType;
  withoutLabel?: boolean;
}

const DlcBalances_Defult: DlcBalances = {
  balance: BN_ZERO,
  isFrozen: false,
  isSufficient: false
}

const DlcBalancesLocks_Defult = BN_ZERO

const DEFAULT_BALANCES: BalanceActiveType = {
  available: true,
  bonded: true,
  locked: true,
  redeemable: true,
  reserved: true,
  total: true,
  unlocking: true,
  vested: true,
};
const DEFAULT_EXTENDED = {
  crypto: true,
  nonce: true,
};
const DEFAULT_PREFS = {
  unstakeThreshold: true,
  validatorPayment: true,
};

// skip balances retrieval of none of this matches
function skipBalancesIf({ withBalance = true, withExtended = false }: Props): boolean {
  if (withBalance === true || withExtended === true) {
    return false;
  } else if (isObject(withBalance)) {
    // these all pull from the all balances
    if (
      withBalance.available ||
      withBalance.locked ||
      withBalance.reserved ||
      withBalance.total ||
      withBalance.vested
    ) {
      return false;
    }
  } else if (isObject(withExtended)) {
    if (withExtended.nonce) {
      return false;
    }
  }

  return true;
}

function skipStakingIf({ stakingInfo, withBalance = true, withValidatorPrefs = false }: Props): boolean {
  if (stakingInfo) {
    return true;
  } else if (withBalance === true || withValidatorPrefs) {
    return false;
  } else if (isObject(withBalance)) {
    if (withBalance.unlocking || withBalance.redeemable) {
      return false;
    } else if (withBalance.bonded) {
      return Array.isArray(withBalance.bonded);
    }
  }

  return true;
}

// calculates the bonded, first being the own, the second being nominated
function calcBonded(stakingInfo?: DeriveStakingAccount, bonded?: boolean | BN[]): [BN, BN[]] {
  let other: BN[] = [];
  let own = BN_ZERO;

  if (Array.isArray(bonded)) {
    other = bonded.filter((_, index): boolean => index !== 0).filter((value): boolean => value.gtn(0));

    own = bonded[0];
  } else if (stakingInfo && stakingInfo.stakingLedger && stakingInfo.accountId.eq(stakingInfo.stashId)) {
    own = stakingInfo.stakingLedger.active.unwrap();
  }

  return [own, other];
}

function renderExtended({ address, balancesAll, withExtended }: Props, t: TFunction): React.ReactNode {
  const extendedDisplay = withExtended === true ? DEFAULT_EXTENDED : withExtended || undefined;

  if (!extendedDisplay) {
    return null;
  }

  return (
    <div className="column">
      {balancesAll && extendedDisplay.nonce && (
        <>
          <Label label={t<string>("transactions")} />
          <div className="result">{formatNumber(balancesAll.accountNonce)}</div>
        </>
      )}
      {extendedDisplay.crypto && (
        <>
          <Label label={t<string>("type")} />
          <CryptoType accountId={address} className="result" />
        </>
      )}
    </div>
  );
}

function renderValidatorPrefs({ stakingInfo, withValidatorPrefs = false }: Props, t: TFunction): React.ReactNode {
  const validatorPrefsDisplay = withValidatorPrefs === true ? DEFAULT_PREFS : withValidatorPrefs;

  if (!validatorPrefsDisplay || !stakingInfo || !stakingInfo.validatorPrefs) {
    return null;
  }

  return (
    <>
      <div />
      {validatorPrefsDisplay.unstakeThreshold &&
        (stakingInfo.validatorPrefs as any as ValidatorPrefsTo145).unstakeThreshold && (
          <>
            <Label label={t<string>("unstake threshold")} />
            <div className="result">
              {(stakingInfo.validatorPrefs as any as ValidatorPrefsTo145).unstakeThreshold.toString()}
            </div>
          </>
        )}
      {validatorPrefsDisplay.validatorPayment &&
        (stakingInfo.validatorPrefs.commission ||
          (stakingInfo.validatorPrefs as any as ValidatorPrefsTo145).validatorPayment) &&
        ((stakingInfo.validatorPrefs as any as ValidatorPrefsTo145).validatorPayment ? (
          <>
            <Label label={t<string>("commission")} />
            <FormatBalance
              className="result"
              value={(stakingInfo.validatorPrefs as any as ValidatorPrefsTo145).validatorPayment}
            />
          </>
        ) : (
          <>
            <Label label={t<string>("commission")} />
            <span>{(stakingInfo.validatorPrefs.commission.unwrap().toNumber() / 10_000_000).toFixed(2)}%</span>
          </>
        ))}
    </>
  );
}

function createBalanceItems(
  formatIndex: number,
  lookup: Record<string, string>,
  t: TFunction,
  {
    address,
    balanceDisplay,
    balancesAll,
    dlcBalances,
    dlcBalancesLocks,
    dlcBalancesAll,
    bestNumber,
    democracyLocks,
    isAllLocked,
    otherBonded,
    ownBonded,
    stakingInfo,
    withBalanceToggle,
  }: {
    address: string;
    balanceDisplay: BalanceActiveType;
    balancesAll?: DeriveBalancesAll | DeriveBalancesAccountData;
    dlcBalances: DlcBalances;
    dlcBalancesLocks: BN;
    dlcBalancesAll: string;
    bestNumber: BlockNumber;
    democracyLocks?: DeriveDemocracyLock[];
    isAllLocked: boolean;
    otherBonded: BN[];
    ownBonded: BN;
    stakingInfo?: DeriveStakingAccount;
    withBalanceToggle: boolean;
  }
): React.ReactNode {
  const allItems: React.ReactNode[] = [];
  // dlcBalancesAll &&
  //   Number(dlcBalancesAll) &&
  //   allItems.push(
  //     <React.Fragment key={11}>
  //       <Label label={t<string>("DLC_total")} />
  //       <FormatBalancenew
  //         className="result"
  //         formatIndex={formatIndex}
  //         value={dlcBalancesAll}
  //       />
  //     </React.Fragment>
  //   );
  dlcBalances &&
    !dlcBalances.balance.isZero() &&
    allItems.push(
      <React.Fragment key={10}>
        <Label label={dlcBalances.isFrozen.toString() == 'true' ? t<string>("DLC_frozen") : t<string>("transferrable")} />
        <FormatBalancenew
          className="result"
          formatIndex={formatIndex}
          value={dlcBalances.balance}
        />
      </React.Fragment>
    );
  dlcBalancesLocks &&
    !dlcBalancesLocks.isZero() &&
    allItems.push(
      <React.Fragment key={11}>
        <Label label={t<string>("locked")} />
        <FormatBalancenew
          className="result"
          formatIndex={formatIndex}
          value={dlcBalancesLocks}
        />
      </React.Fragment>
    );
  if (withBalanceToggle) {
    return (
      <React.Fragment key={formatIndex}>
        <Expander
          summary={
            <FormatBalancenew
              formatIndex={formatIndex}
              value={dlcBalancesAll}
            />
          }
        >
          {allItems.length !== 0 && <div className="body column">{allItems}</div>}
        </Expander>
      </React.Fragment>
    );
  }
  return <React.Fragment key={formatIndex}>{allItems}</React.Fragment>;
}

function renderBalances(
  props: Props,
  lookup: Record<string, string>,
  bestNumber: BlockNumber | undefined,
  t: TFunction
): React.ReactNode[] {
  const { address, balancesAll, democracyLocks, stakingInfo, dlcBalances = DlcBalances_Defult, dlcBalancesLocks = DlcBalancesLocks_Defult, withBalance = true, withBalanceToggle = false } = props;
  const dlcBalancesAll = dlcBalances.balance.toJSON() + dlcBalancesLocks.toJSON()
  const balanceDisplay = withBalance === true ? DEFAULT_BALANCES : withBalance || false;
  if (!bestNumber || !balanceDisplay) {
    return [null];
  }

  const [ownBonded, otherBonded] = calcBonded(stakingInfo, balanceDisplay.bonded);
  const isAllLocked = !!balancesAll && balancesAll.lockedBreakdown.some(({ amount }): boolean => amount.isMax());
  const baseOpts = {
    address,
    balanceDisplay,
    bestNumber,
    democracyLocks,
    isAllLocked,
    otherBonded,
    ownBonded,
    withBalanceToggle,
  };
  const items = [createBalanceItems(0, lookup, t, { ...baseOpts, balancesAll, stakingInfo, dlcBalances, dlcBalancesLocks, dlcBalancesAll })];

  withBalanceToggle &&
    balancesAll?.additional.length &&
    balancesAll.additional.forEach((balancesAll, index): void => {
      items.push(createBalanceItems(index + 1, lookup, t, { ...baseOpts, balancesAll, dlcBalances, dlcBalancesLocks, dlcBalancesAll }));
    });

  return items;
}

function AddressInfo(props: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const bestNumber = useBestNumber();
  const { children, className = "", extraInfo, withBalanceToggle, withHexSessionId } = props;

  const lookup = useRef<Record<string, string>>({
    democrac: t<string>("via Democracy/Vote"),
    phrelect: t<string>("via Council/Vote"),
    "staking ": t<string>("via Staking/Bond"),
    "vesting ": t<string>("via Vesting"),
  });

  return (
    <div className={`ui--AddressInfo${className}${withBalanceToggle ? " ui--AddressInfo-expander" : ""}`}>
      <div className={`column${withBalanceToggle ? " column--expander" : ""}`}>
        {renderBalances(props, lookup.current, bestNumber, t)}
        {withHexSessionId && withHexSessionId[0] && (
          <>
            <Label label={t<string>("session keys")} />
            <div className="result">{withHexSessionId[0]}</div>
          </>
        )}
        {withHexSessionId && withHexSessionId[0] !== withHexSessionId[1] && (
          <>
            <Label label={t<string>("session next")} />
            <div className="result">{withHexSessionId[1]}</div>
          </>
        )}
        {renderValidatorPrefs(props, t)}
        {extraInfo && (
          <>
            <div />
            {extraInfo.map(
              ([label, value], index): React.ReactNode => (
                <React.Fragment key={`label:${index}`}>
                  <Label label={label} />
                  <div className="result">{value}</div>
                </React.Fragment>
              )
            )}
          </>
        )}
      </div>
      {renderExtended(props, t)}
      {children && <div className="column">{children}</div>}
    </div>
  );
}

export default withMulti(
  styled(AddressInfo)`
    align-items: flex-start;
    display: flex;
    flex: 1;
    white-space: nowrap;

    &:not(.ui--AddressInfo-expander) {
      justify-content: center;
    }

    .column {
      justify-content: start;

      &.column--expander {
        width: 17.5rem;

        .ui--Expander {
          width: 100%;

          .summary {
            display: inline-block;
            text-align: right;
            min-width: 12rem;
          }
        }
      }

      &:not(.column--expander) {
        flex: 1;
        display: grid;
        opacity: 1;

        label {
          grid-column: 1;
          padding-right: 0.5rem;
          text-align: right;
          vertical-align: middle;

          .help.circle.icon {
            display: none;
          }
        }

        .result {
          grid-column: 2;

          .icon {
            margin-left: 0;
            margin-right: 0.25rem;
            padding-right: 0 !important;
          }
        }
      }
    }
  `,
  withCalls<Props>(
    [
      "derive.balances.all",
      {
        paramName: "address",
        propName: "balancesAll",
        skipIf: skipBalancesIf,
      },
    ],
    [
      "derive.staking.account",
      {
        paramName: "address",
        propName: "stakingInfo",
        skipIf: skipStakingIf,
      },
    ],
    [
      "derive.democracy.locks",
      {
        paramName: "address",
        propName: "democracyLocks",
        skipIf: skipStakingIf,
      },
    ],
    [
      "query.assets.account",
      {
        paramName: "dlcAssets",
        propName: "dlcBalances",
        skipIf: skipStakingIf,
      },
    ],
    [
      "query.assets.locked",
      {
        paramName: "dlcAssets",
        propName: "dlcBalancesLocks",
        skipIf: skipStakingIf,
      },
    ]
  )
);
