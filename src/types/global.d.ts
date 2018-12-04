declare module global {}

/**
 * Type keyed by ID (string)
 */
type ById<T> = { [idx: string]: T };

/**
 * Update an array at the specified index
 */
type ArrayUpdate<T> = { data: T; idx: number };

/**
 * Type keyed by ID, then by Date (strings)
 */
type ByIdThenByDate<T> = { [idKey: string]: { [dateKey: string]: T } };

/**
 * Diff of two types
 */
type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

// Omit type https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-377567046
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * A resource that can be fetched, with loading/error states
 */
type Fetchable<TResource, TFeedback> = {
    /**
     * The resource in question
     */
    data: TResource;
    /**
     * Whether currently loading
     */
    loading: boolean;
    /**
     * Whether data has successfully loaded, at least the first time
     */
    hasLoaded: boolean;
    /**
     * Whether there is currently an error
     */
    hasError: boolean;
    /**
     * Display messages/errors
     */
    feedback: TFeedback;
    /**
     * Timestamp of last successful fetch
     */
    lastFetchSuccess: number;
};

/**
 * Generic wrapper to allow comparing a current + previous instance of a resource
 */
type Diffable<TResource> = {
    /**
     * Latest resource instance
     */
    cur: TResource;
    /**
     * Previous resource instance
     */
    prev: TResource;
};

/**
 * Fetch a thing (keyed by ID) that you may then diff
 */
type FetchableDiffable<TResource, TFeedback> = Fetchable<ById<Diffable<TResource>>, TFeedback>;
