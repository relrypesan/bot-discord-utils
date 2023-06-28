import { Event } from "../../structs/types/Event";

export default new Event({
    name: "error",
    run(error){
        console.error(`❌ Houve um erro no bot.\n${error}`.red);
    },
})