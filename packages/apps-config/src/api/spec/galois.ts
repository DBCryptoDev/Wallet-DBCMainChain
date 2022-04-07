// Copyright 2017-2021 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { OverrideBundleDefinition } from "@polkadot/types/types";

// structs need to be in order
/* eslint-disable sort-keys */

const definitions: OverrideBundleDefinition = {
  types: [
    {
      // on all versions
      minmax: [0, undefined],
      types: {
        Address: "MultiAddress",
        LookupSource: "MultiAddress",
        Balance: "u128",
        RefCount: "u32",
        Account: {
          nonce: "U256",
          balance: "U256",
        },
        Transaction: {
          nonce: "U256",
          action: "String",
          gas_price: "u64",
          gas_limit: "u64",
          value: "U256",
          input: "Vec<u8>",
          signature: "Signature",
        },
        Signature: {
          v: "u64",
          r: "H256",
          s: "H256",
        },
        ExitReason: "U256",
        AccountServiceEnum: {
          _enum: {
            Nickname: "String",
            Ethereum: "H160",
          },
        },
        MultiAddressDetails: {
          nickname: "AccountServiceEnum",
          ethereum: "AccountServiceEnum",
        },
        Nickname: "String",
        Ethereum: "H160",
        TransferAmountInfo: {
          date: "u64",
          daily_info: "Balance",
          monthly_info: "Balance",
          yearly_info: "Balance",
        },
        AccountLimit: {
          daily_limit: "Balance",
          monthly_limit: "Balance",
          yearly_limit: "Balance",
        },
      },
    },
  ],
};

export default definitions;
