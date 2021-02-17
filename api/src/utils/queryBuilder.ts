import { IQueryBuilderArgs } from '../interfaces/index'


/*
    mongoDB aggregation query builder
*/


export default function queryBuilder(params: IQueryBuilderArgs, type: string) {
    let query: any[] = [{ $match: params.basicFilter }]
    // basic viols query
    const basicViols = [
        { $unwind: "$VIOLS_ASUNBD" }, { $match: { "VIOLS_ASUNBD.VINA_MASH": { $gt: 1 } } }, {
            $lookup: {
                from: "nsi_viols_asunbd",
                localField: "VIOLS_ASUNBD.ID_VIOL",
                foreignField: "VIOL_ID",
                as: "nsi_viols"
            }
        }, { $unwind: "$nsi_viols" }
    ]
    const count = [
        { $count: "total" }
    ]
    const basicFormat = { ROAD_ID: "$ROAD_ID", DEPO_ID: "$DEPO_ID", COL_ID: "$COL_ID", TAB_NUM8: "$TAB_NUM8" }
    const formatted = [
        { $project: basicFormat }
    ]
    const formattedRiskPredict = [
        {
            $project: {
                ...basicFormat,
                start: "$DATE_WORK",
                dailyResult: "$PROB",
            }
        }
    ]
    const formattedVIOLS = [
        {
            $project: {
                ...basicFormat,
                date: "$VIOLS_ASUNBD.VIOL_DATE",
                category: "$nsi_viols.VIOL_GROUP",
                violation: "$nsi_viols.VIOL_NAME"
            }
        }
    ]
    const dateFilter = params.dateField ? [
        {
            $match: {
                [params.dateField]: {
                    $gt: params.datesPeriod ? new Date(params.datesPeriod.startOfMonth) : new Date(),
                    $lt: params.datesPeriod ? new Date(params.datesPeriod.endOfMonth) : new Date()
                }
            }
        }
    ] : []
    const datePeriodFilter = params.dateFieldPeriod ? [
        {
            $match: {
                $or: [
                    {
                        [params.dateFieldPeriod.startField]: {
                            $gt: params.datesPeriod ? new Date(params.datesPeriod.startOfMonth) : new Date(),
                            $lt: params.datesPeriod ? new Date(params.datesPeriod.endOfMonth) : new Date()
                        }
                    },
                    {
                        [params.dateFieldPeriod.endField]: {
                            $gt: params.datesPeriod ? new Date(params.datesPeriod.startOfMonth) : new Date(),
                            $lt: params.datesPeriod ? new Date(params.datesPeriod.endOfMonth) : new Date()
                        }
                    }
                ]

            }
        }
    ] : []
    const QueryDict: any = {
        // рейтинг грубые
        grub: [
            ...basicViols,
            ...dateFilter,
            { $match: { "nsi_viols.VIOL_GUILT": 2 } },
            ...formatted,
            ...count
        ],
        // рейтинг не грубые
        ne_grub: [
            ...basicViols,
            ...dateFilter,
            { $match: { "nsi_viols.VIOL_GUILT": { $lt: 2 } } },
            ...formatted,
            ...count
        ],
        // рейтинг знания
        knowledge: [
            { $unwind: "$ASPT" },
            ...dateFilter,
            { $group: { _id: "", avgQuantity: { $avg: "$ASPT.RESULT_ASPT" } } },
            {
                $project: {
                    "avgQuantity": '$avgQuantity'
                }
            }
        ],
        // рейтинг дисциплина
        discipline: [
            { $match: { "CARD_BDP": { $gt: 1 } } },
            ...count
        ],
        // меры
        mery: [
            { $unwind: "$VIOLS_TCHMI" },
            ...dateFilter,
            { $unwind: "$VIOLS_TCHMI.ID_EVENTS" },
            { $match: { "VIOLS_TCHMI.ID_EVENTS": params.aliasId } },
            ...count
        ],
        // прогноз
        predict: [
            ...dateFilter,
            ...formattedRiskPredict,
        ],
        // скрытые факторы
        personHiddenFact: [
            {
                $project: {
                    "FACTORS": '$FACTORS'
                }
            }
        ],
        // Данные по нарушениям
        voils_table: [
            { $unwind: "$VIOLS_ASUNBD" },
            { $match: { "VIOLS_ASUNBD.VINA_MASH": { $gt: 1 } } },
            ...dateFilter,
            {
                $lookup: {
                    from: "nsi_viols_asunbd",
                    localField: "VIOLS_ASUNBD.ID_VIOL",
                    foreignField: "VIOL_ID",
                    as: "nsi_viols"
                }
            },
            { $unwind: "$nsi_viols" },
            ...formattedVIOLS
        ],
        // график карточка риски
        viols_chart_risk: [
            ...dateFilter,
            ...formattedRiskPredict,
        ],
        // график карточка нарушения машиниста
        viols_chart_weight: [
            { $unwind: "$VIOLS_ASUNBD" },
            ...dateFilter,
            {
                $lookup: {
                    from: "nsi_viols_asunbd",
                    localField: "VIOLS_ASUNBD.ID_VIOL",
                    foreignField: "VIOL_ID",
                    as: "nsi_viols"
                }
            },
            { $unwind: "$nsi_viols" },
            {
                $project: {
                    ROAD_ID: "$ROAD_ID", DEPO_ID: "$DEPO_ID", COL_ID: "$COL_ID", TAB_NUM8: "$TAB_NUM8",
                    date: "$VIOLS_ASUNBD.VIOL_DATE",
                    weight: "$nsi_viols.VIOL_VES"
                }
            }
        ],
        // info-cards часы выработки
        info_card_hours: [
            { $unwind: "$WORK" },
            ...datePeriodFilter,
            {
                $project: {
                    ROAD_ID: "$ROAD_ID", DEPO_ID: "$DEPO_ID", COL_ID: "$COL_ID", TAB_NUM8: "$TAB_NUM8",
                    start: "$WORK.START",
                    end: "$WORK.END"
                }
            }
        ],
        // info-cards Использование ТЭР 
        info_card_ter: [
            { $unwind: "$WORK" },
            ...datePeriodFilter,
        ],
        // info-cards аспт
        info_card_aspt: [
            { $unwind: "$ASPT" },
            ...dateFilter,
        ],
        // Данные по нарушениям
        predict_viols: [
            // ...dateFilter,
        ],
        // Прогнозируемые нарушения 
        recommend_predict: [
            {
                $project: {
                    item: 1,
                    dimensions: { $objectToArray: "$RECOMMEND_VIOLS.RECOMMEND" }
                }
            },
            { $unwind: "$dimensions" },
            {
                $lookup: {
                    from: "nsi_viols_asunbd",
                    localField: "dimensions.k",
                    foreignField: "VIOL_CODE",
                    as: "nsi_viols"
                }
            },
            { $unwind: "$nsi_viols" },
            {
                $project: {
                    _id: 0,
                    priority: "$dimensions.v",
                    event: "$nsi_viols.VIOL_NAME"
                }
            }
        ],
        // ПФО в карточке машиниста
        pfo: [
            { $unwind: "$PSICH_PFO" },
            { $group: { _id: "$PSICH_PFO.GROUP", date: { $max: "$PSICH_PFO.PFO_FIN" } } },
            {
                $project: {
                    _id: 0,
                    group: "$_id",
                    date: '$date'
                }
            }
        ],
        // ДКФС в карточке машиниста
        dkfs: [
            { $unwind: "$PSICH_DKFS" },
            {
                $addFields: {
                    DAN_TYPE: "psich_dkfs"
                }
            },
            {
                $lookup:
                {
                    from: "nsi_multes",
                    let: { dt: "$DAN_TYPE", tempId: "$PSICH_DKFS.REZ_FS" },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$DAN_TYPE", "$$dt"] }
                                        ]
                                }
                            }
                        },
                        { $unwind: "$DATA" },
                        {
                            $project: {
                                DATA: 1
                            }
                        },
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$DATA.CODE", "$$tempId"] }
                                        ]
                                }
                            }
                        }
                    ],
                    as: "params"
                }
            },
            {
                $project: {
                    date: "$PSICH_DKFS.DATE",
                    text: "$params.DATA.PARAM_NAME"
                }
            },
            { $unwind: "$text" },
        ],
        // ДКФС таблица
        DKFS_table: [
            {
                $facet: {
                    resultFilters: [
                        { $unwind: "$PSICH_DKFS" },
                        ...dateFilter,
                        { $unwind: "$PSICH_DKFS.REZ_FS" },
                        { $match: { "PSICH_DKFS.REZ_FS": params.aliasId } },
                        ...count
                    ],
                    resultCount: [
                        {
                            $count: 'count'
                        }
                    ]
                }
            }
        ],
        // таблица Мониторинг поступления данных по бригадам
        monitoring_data_crews_table: [
            {
                $lookup: {
                    from: "dan_types",
                    localField: "DAN_TYPE",
                    foreignField: "DAN_TYPE",
                    as: "dan_types"
                }
            },
            { $unwind: "$dan_types" },
            {
                $group: {
                    _id: "$DAN_TYPE", NAME: { "$first": "$NAME" }, DAN_TYPE: { "$first": "$DAN_TYPE" },
                    NUM_ROWS: { "$first": "$NUM_ROWS" }, CTIME: { $max: "$CTIME" },
                    DAYS_EXPIRE: { "$first": "$dan_types.DAYS_EXPIRE" }
                }
            }
        ],
        // Анализ соответствия выявляемых нарушений бригад времени работы
        table_time_viols_crews: [
            ...dateFilter,
            {
                $facet: {
                    resultFixViols: [
                        { $unwind: "$CODE_VIOL" },
                        { $match: { "FIX_VIOL": true } },
                        ...count,
                    ],
                    resultCount: [
                        { $unwind: "$CODE_VIOL" },
                        ...count,
                    ]
                }
            }
        ],
        // Детализация Анализа соответствия выявляемых нарушений бригад времени работы
        table_time_viols_crews_details: [
            ...dateFilter,
            {
                $lookup: {
                    from: "nsi_roads",
                    localField: "ROAD_ID",
                    foreignField: "ID",
                    as: "road"
                }
            },
            { $unwind: "$road" },
            {
                $lookup: {
                    from: "nsi_depos",
                    localField: "DEPO_ID",
                    foreignField: "ID",
                    as: "depo"
                }
            },
            { $unwind: "$depo" },
            {
                $addFields: {
                    DAN_TYPE: params.aliasId,
                }
            },
            { $unwind: "$CODE_VIOL" },
            {
                $lookup:
                {
                    from: "nsi_multes",
                    let: { dt: "$DAN_TYPE", tempId: { $cond: { if: { $isArray: ["$CODE_VIOL"] }, then: { $arrayElemAt: ["$CODE_VIOL", 0] }, else: "$CODE_VIOL" } } },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$DAN_TYPE", "$$dt"] }
                                        ]
                                }
                            }
                        },
                        { $unwind: "$DATA" },
                        {
                            $project: {
                                DATA: 1
                            }
                        },
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$DATA.VIOL_ID", "$$tempId"] }
                                        ]
                                }
                            }
                        }
                    ],
                    as: "params"
                }
            },
            { $unwind: "$params" },
            {
                $project: {
                    _id: 0,
                    viol: "$params.DATA.VIOL_NAME",
                    road: "$road.SNAME",
                    depo: "$depo.NAME",
                    tab_num: "$TAB_NUM8",
                    datetime: "$DATE_VIOL",
                }
            },
        ]

    }
    query = [...query, ...QueryDict[type]]

    return query
}


