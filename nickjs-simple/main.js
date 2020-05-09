// https://www.npmjs.com/package/nickjs
const Nick = require("nickjs");
const nick = new Nick();

(async () => {
    // Step 1: Do an action
    const tab = await nick.newTab()
    // Step 2: Wait for the action to have an effect
    await tab.open("chrisjmendez.com")
    await tab.untilVisible(".main-content-area") // Make sure we have loaded the page
    // Step 3: Use jQuery to scrape
	await tab.inject("https://code.jquery.com/jquery-3.2.1.min.js")
	const myLinks = await tab.evaluate( (arg, callback) => {
		// Here we're in the page context. It's like being in your browser's inspector tool
		const data = [];
		$(".content-area-wrap article").each((index, element) => {
			data.push({
				title: $.trim( $(element).find(".title").text() ),
				url:   $(element).find(".title a").attr("href"),
				desciption: $.trim( $(element).find(".post-content").text() )
			});
		});
		callback(null, data);
	})
	console.log(myLinks);
	//console.log(JSON.stringify(myLinks, null, 2))
})()
    .then( () => {
        console.log("Job done!")
        nick.exit()
    })
    .catch( (err) => {
        console.log(`Something went wrong: ${err}`)
        nick.exit(1)
    })