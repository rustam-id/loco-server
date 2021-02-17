import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ обобщенная
*/

export interface INSIMulti {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSIMulti & Document>('nsi_multes', entrySchema);