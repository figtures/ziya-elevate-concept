/** Offer the explicitly requested new press page as an unsaved admin draft.
 * This runs only after reading every cms_documents row, including the archive.
 * A local entry is not publication and performs no database writes. Existing
 * documents always win, even if unpublished, archived, or moved to a new route.
 */
export function withInitialPageDrafts(rows,seed){
 const press=seed.find(document=>document.route==='/basin/'&&document.template==='/basin/');
 if(!press||rows.some(row=>row.route===press.route||row.id===press.id))return rows;
 return [...rows,{id:press.id,route:press.route,kind:press.kind,draft:structuredClone(press),revision:0,published_revision:null,archived:false}];
}
