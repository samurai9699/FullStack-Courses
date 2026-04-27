const fs = require('fs');
const kd = require('kanji-data');

async function main() {
  console.log("Fetching N5 vocab...");
  const n5VocabRes = await fetch('https://jlpt-vocab-api.vercel.app/api/words?level=5&limit=1000');
  const n5Vocab = await n5VocabRes.json();
  
  console.log("Fetching N4 vocab...");
  const n4VocabRes = await fetch('https://jlpt-vocab-api.vercel.app/api/words?level=4&limit=1500');
  const n4Vocab = await n4VocabRes.json();

  console.log("Fetching N3 vocab to reach 2000 total...");
  const n3VocabRes = await fetch('https://jlpt-vocab-api.vercel.app/api/words?level=3&limit=2000');
  const n3Vocab = await n3VocabRes.json();

  let allVocabRaw = [...n5Vocab.words, ...n4Vocab.words];
  const neededVocab = 2000 - allVocabRaw.length;
  if (neededVocab > 0) {
    allVocabRaw = [...allVocabRaw, ...n3Vocab.words.slice(0, neededVocab)];
  }

  console.log(`Fetched ${allVocabRaw.length} vocabulary words.`);

  let vocabList = [];
  allVocabRaw.forEach((v, i) => {
    vocabList.push({
      id: `v${i+1}`,
      word: v.word,
      kana: v.furigana || v.word,
      meaning: v.meaning
    });
  });

  console.log("Extracting Kanji...");
  const n5KanjiChars = kd.getJlpt(5);
  const n4KanjiChars = kd.getJlpt(4);
  const n3KanjiChars = kd.getJlpt(3);
  
  let allKanjiChars = [...n5KanjiChars, ...n4KanjiChars];
  const neededKanji = 300 - allKanjiChars.length;
  if (neededKanji > 0) {
    allKanjiChars = [...allKanjiChars, ...n3KanjiChars.slice(0, neededKanji)];
  }

  console.log(`Extracting ${allKanjiChars.length} kanji characters...`);
  
  let kanjiList = [];
  for (let i = 0; i < allKanjiChars.length; i++) {
    const char = allKanjiChars[i];
    try {
      const details = kd.get(char);
      kanjiList.push({
        id: `k${i+1}`,
        char: char,
        onyomi: details.on_readings.join(', '),
        kunyomi: details.kun_readings.join(', '),
        meaning: details.meanings.join(', ')
      });
    } catch(e) {
      console.log("Error fetching", char);
    }
  }

  console.log("Reading n4_mastery.html...");
  let html = fs.readFileSync('n4_mastery.html', 'utf8');

  // Replace kanji array
  const kanjiStr = 'kanji: ' + JSON.stringify(kanjiList, null, 4) + ',';
  html = html.replace(/kanji:\s*\[[\s\S]*?\],\s*vocab:/, kanjiStr + '\n  vocab:');

  // Replace vocab array
  const vocabStr = 'vocab: ' + JSON.stringify(vocabList, null, 4) + ',';
  html = html.replace(/vocab:\s*\[[\s\S]*?\],\s*grammar:/, vocabStr + '\n  grammar:');

  fs.writeFileSync('n4_mastery.html', html);
  console.log("Successfully injected data into n4_mastery.html");
}

main();
