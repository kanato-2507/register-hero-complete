/**
 * Register Hero - Shared Question Database
 * Used by both Beginner (TRAINEE) and Intermediate (MANAGER) modes.
 */

const MASTER_QUESTIONS = [
    // 1. Basic Greeting / Status
    {
        id: "q1",
        text: "これ、免税になりますか？",
        audio: "Is this tax-free?",
        sentence: "It's not a duty-free shop",
        answer_jp: "ここは免税店ではありません"
    },
    {
        id: "q2",
        text: "この価格は税込みですか？",
        audio: "Is tax included in this price?",
        sentence: "Yes tax is included",
        answer_jp: "はい、税込価格です"
    },
    {
        id: "q3",
        text: "プレゼント包装できますか？",
        audio: "Can you wrap this for a gift?",
        sentence: "Certainly free of charge",
        answer_jp: "かしこまりました、無料で承ります"
    },
    {
        id: "q4",
        text: "クレジットカード使えますか？",
        audio: "Do you accept credit cards?",
        sentence: "Yes we do",
        answer_jp: "はい、ご利用いただけます"
    },
    {
        id: "q5",
        text: "交通系ICカードは使えますか？",
        audio: "Can I use Suica or Pasmo?",
        sentence: "Yes you can use transportation IC cards",
        answer_jp: "はい、交通系ICカードをご利用いただけます"
    },
    {
        id: "q6",
        text: "返品できますか？",
        audio: "Can I return this?",
        sentence: "I'm sorry we don't accept returns",
        answer_jp: "申し訳ありませんが、返品はお受けできません"
    },
    {
        id: "q7",
        text: "営業時間は何時までですか？",
        audio: "What time do you close?",
        sentence: "We are open from ten AM to eight PM",
        answer_jp: "午前10時から午後8時まで営業しております"
    },
    {
        id: "q8",
        text: "商品画像を見せて）これありますか？",
        audio: "Do you have this?",
        sentence: "We don't have it",
        answer_jp: "当店では取り扱っておりません"
    },
    {
        id: "q9",
        text: "一番人気はどれですか？",
        audio: "Which one is the most popular?",
        sentence: "This novel is the number one bestseller",
        answer_jp: "こちらの小説が一番人気です"
    },
    {
        id: "q10",
        text: "袋はいりますか？（店員役として）",
        audio: "Do you need a bag?",
        sentence: "Plastic bags cost five yen",
        answer_jp: "レジ袋は5円かかります"
    },

    // 2. Locations / Directions
    {
        id: "q11",
        text: "コミック売り場はどこですか？",
        audio: "Where are the comics?",
        sentence: "Go straight down this aisle and it's on your left",
        answer_jp: "この通路をまっすぐ行くと左手にございます"
    },
    {
        id: "q12",
        text: "文房具は置いていますか？",
        audio: "Do you sell stationery?",
        sentence: "Stationery is on the left side of the store",
        answer_jp: "文房具は店内の左側にございます"
    },
    {
        id: "q13",
        text: "ここは何階ですか？",
        audio: "What floor is this?",
        sentence: "This is the third floor",
        answer_jp: "こちらは3階でございます"
    },
    {
        id: "q14",
        text: "ここから新館に行けますか？",
        audio: "Can I go to the new building from here?",
        sentence: "The third floor is not connected to the new building",
        answer_jp: "3階からは新館につながっておりません"
    },
    {
        id: "q15",
        text: "2階へはどう行けばいいですか？",
        audio: "How do I get to the 2nd floor?",
        sentence: "Take the escalator down to the second floor",
        answer_jp: "エスカレーターで2階へ降りてください"
    },
    {
        id: "q16",
        text: "エスカレーターはどこですか？",
        audio: "Where is the escalator?",
        sentence: "The escalator is over there",
        answer_jp: "エスカレーターはあちらにございます"
    },
    {
        id: "q17",
        text: "電気屋さんはどこですか？",
        audio: "Where is the electronics store?",
        sentence: "The electronics store is on the fourth floor of the new building",
        answer_jp: "電気屋は新館の4階にあります"
    },
    {
        id: "q18",
        text: "トイレはどこですか？",
        audio: "Where is the restroom?",
        sentence: "Go out of the store walk left down the aisle and turn left again at the end",
        answer_jp: "店を出て通路を左に歩いて、突き当りをもう一度左です"
    },

    // 3. Tourist Specific
    {
        id: "q19",
        text: "英語の小説はありますか？",
        audio: "Do you have English novels?",
        sentence: "Yes they are by pillar eleven in the back right",
        answer_jp: "あります。お店の右側奥の11番の柱のところにございます"
    },
    {
        id: "q20",
        text: "荷物を預かってもらえますか？",
        audio: "Can I leave my luggage here?",
        sentence: "Sorry we don't have a cloakroom",
        answer_jp: "申し訳ありませんが、クローク(荷物預かり)はございません"
    },
    {
        id: "q21",
        text: "Wi-Fiはありますか？",
        audio: "Do you have Wi-Fi?",
        sentence: "We provide free Wi-Fi for customers",
        answer_jp: "お客様用の無料Wi-Fiがございます"
    },
    {
        id: "q22",
        text: "写真を撮ってもいいですか？",
        audio: "Can I take a picture?",
        sentence: "Please refrain from taking pictures",
        answer_jp: "撮影はご遠慮ください"
    }
    },

// 4. Additional Scenarios
{
    id: "q23",
        text: "すみません（店員を呼ぶ）",
            audio: "Excuse me",
                sentence: "Just a moment please",
                    answer_jp: "少々お待ちください"
},
{
    id: "q24",
        text: "案内してください",
            audio: "Can you show me where it is?",
                sentence: "Right this way please",
                    answer_jp: "こちらです"
},
{
    id: "q25",
        text: "クレジットカードのタッチ決済できますか",
            audio: "Can I use contactless payment?",
                sentence: "Yes you can",
                    answer_jp: "できます"
},
{
    id: "q26",
        text: "（支払いが1000円足りません）",
            audio: "Here you go",
                sentence: "May I have another one thousand yen bill",
                    answer_jp: "1000円札をもう一枚いただけますか"
},
{
    id: "q27",
        text: "（支払いが1万円足りません）",
            audio: "Here you go",
                sentence: "May I have another ten thousand yen bill",
                    answer_jp: "1万円札をもう一枚いただけますか"
},
{
    id: "q28",
        text: "（支払いが100円足りません）",
            audio: "Here you go",
                sentence: "May I have another one hundred yen coin",
                    answer_jp: "100円玉をもう一枚いただけますか"
},
{
    id: "q29",
        text: "これいくらですか？",
            audio: "How much is this?",
                sentence: "It is one thousand three hundred sixty five yen tax is included",
                    answer_jp: "1365円です。税込みです"
}
];
