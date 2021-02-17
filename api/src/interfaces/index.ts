
// interface for building aggregate MongoDB queries function
export interface IQueryBuilderArgs {
    datesPeriod?: {
        startOfMonth: string,
        endOfMonth: string,
    },
    dateField?: string,         // name of filtered by date period field
    basicFilter?: {
        [x: string]: any
    },  
    aliasId?: number,          // specific id for aggregate cross-collections requests
    dateFieldPeriod?: {
        startField: string,
        endField: string
    }
}