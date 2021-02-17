import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель с нарушениями по поездкам
*/

export interface ICrewsTrips {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrewsTrips & Document>('crews_trips', entrySchema);