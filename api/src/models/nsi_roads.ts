import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ по дорогам
*/

export interface INSIRoad {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSIRoad & Document>('nsi_roads', entrySchema);