import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ по колоннам
*/

export interface INSIColumns {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSIColumns & Document>('nsi_columns', entrySchema);