export type IpfsHash = string;
export type EosName = string;
export type BooleanNumber = number; // 0=false | 1=true;

export interface EosAction<T> {
    block_num: number;
    block_id: string;
    block_time: Date;
    trx_id: string;
    idx: number;
    depth: number;
    trace: EosTrace<T>;
    error?: any;
}

export interface EosTrace<T> {
    receipt: EosTraceReceipt;
    act: EosTraceAct<T>;
    context_free: boolean;
    elapsed: number;
    console: string;
    trx_id: string;
    block_num: number;
    block_time: Date;
    producer_block_id: string;
    account_ram_deltas: Array<RamDelta>;
    except: any;
    inline_traces: Array<any>;
}

export interface EosTraceReceipt {
    receiver: EosName;
    act_digest: string;
    global_sequence: number;
    recv_sequence: number;
    auth_sequence: Array<any>;
    code_sequence: number;
    abi_sequence: number;
}

export interface EosTraceAct<T> {
    account: EosName;
    name: EosName;
    authorization: Array<EosPermission>;
    data: T;
    hex_data: string;
}

export interface RamDelta {
    account: EosName;
    delta: number;
}

export interface EosPermission {
    actor: EosName;
    permission: EosName;
}

export interface Propose {
    proposer: EosName;
    wiki_id: number;
    ipfs_hash: IpfsHash;
    lang_code: string;
    group_id: number;
    comment: string;
    memo: string;
}
export interface Vote {
    voter: EosName;
    proposal_id: number;
    approve: BooleanNumber;
    amount: number;
    comment: string;
    memo: string;
}
export interface ProposalResult {
    proposal_id: number;
    wiki_id: number;
    approved: BooleanNumber;
    yes_votes: number;
    no_votes: number;
}
