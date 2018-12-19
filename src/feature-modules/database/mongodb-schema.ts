export type IpfsHash = string;
export type EosName = string;
export type ProposalApproved = number; // 0=no, 1=yes

export interface EosAction<T> {
    data: EosActionData<T>,
    error?: any
}

export interface EosActionData<T> {
    block_num: number,
    block_id: string,
    block_time: Date,
    trx_id: string,
    idx: number,
    depth: number,
    trace: EosTrace<T>
}

export interface EosTrace<T> {
    receipt: EosTraceReceipt,
    act: EosTraceAct<T>,
    context_free: boolean,
    elapsed: number,
    console: string,
    trx_id: string,
    block_num: number,
    block_time: Date,
    producer_block_id: string,
    account_ram_deltas: Array<RamDelta>,
    except: any,
    inline_traces: Array<any>
}

export interface EosTraceReceipt {
    receiver: EosName,
    act_digest: string,
    global_sequence: number,
    recv_sequence: number,
    auth_sequence: Array<any>,
    code_sequence: number,
    abi_sequence: number
}

export interface EosTraceAct<T> {
    account: EosName,
    name: EosName,
    authorization: Array<EosPermission>,
    data: T,
    hex_data: string    
}

export interface RamDelta {
    account: EosName,
    delta: number
}

export interface EosPermission {
    actor: EosName,
    permission: EosName
}

export interface Propose {
    proposer: EosName,
    proposed_article_hash: IpfsHash,
    old_article_hash: IpfsHash,
    grandparent_hash?: IpfsHash
}
export interface Vote {
    voter: EosName,
    proposal_hash: IpfsHash,
    approve: ProposalApproved,
    amount: number
}
export interface ProposalResult {
    proposal: IpfsHash,
    approved: ProposalApproved,
    yes_votes: number, 
    no_votes: number
}

