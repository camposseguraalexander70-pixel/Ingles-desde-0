export const GOAL=60;
const L=(title,e,rp,items)=>({title,e,rp,items:items.map(([e,en])=>({e,en}))});
export const LEVELS=[
L('Hello','👋','Conoces a alguien nuevo: salúdalo y di tu nombre.',[['👋','Hello!'],['🙋','My name is Ana.'],['🤝','Nice to meet you.']]),
L('Feelings','😊','Un amigo te saluda: pregúntale cómo está y responde cómo estás tú.',[['😊',"I'm fine, thanks."],['😴',"I'm tired."],['❓','How are you?']]),
L('Café','☕','Estás en una cafetería: pide algo y pregunta el precio.',[['☕',"I'd like a coffee, please."],['💵','How much is it?'],['🙏','Thank you very much.']]),
L('Directions','🗺️','Estás perdido en la ciudad: pide indicaciones.',[['🚻','Where is the bathroom?'],['⬅️','Turn left.'],['🗺️',"I'm lost."]]),
L('Wanna / Gonna','🎬','Haz planes para el fin de semana con un amigo.',[['🏠','I wanna go home.'],['📅','What are you gonna do?'],['🎬','Do you wanna watch a movie?']]),
L('Daily life','⏰','Cuéntale a alguien cómo es tu día.',[['⏰','I wake up at seven.'],['🍳',"I'm making breakfast."],['🚌','I take the bus to school.']])];
