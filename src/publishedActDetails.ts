import stored from './data/theater-act-details.json' with {type:'json'};
import {expandActDetails} from './actDetailsStorage.ts';

export default expandActDetails(stored);
