import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ по машинистам
*/

export interface INSICrew {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSICrew & Document>('nsi_crews', entrySchema);