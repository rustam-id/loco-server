import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ по предприятиям
*/

export interface INSIPreds {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSIPreds & Document>('nsi_preds', entrySchema);