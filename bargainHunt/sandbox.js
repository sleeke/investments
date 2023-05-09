function failingPromise() {
  return new Promise(function(resolve, reject) {
    reject("ooops")
  })
}

function succeedingPromise() {
  return new Promise(function(resolve, reject) {
    resolve("Nice.")
  })
} 

function afterFail() {
  return new Promise(function(resolve, reject) {
    console.log("This happened after the promise failed")
    resolve("Fail")
  })
} 

function afterSuccess() {
  return new Promise(function(resolve, reject) {
    console.log("This happened after the promise succeeded")
    resolve("Success")
  })
} 

function alternateWithAFail() {
  console.log("Alternating with a fail...")
  return failingPromise().then(afterSuccess, afterFail)
}

function alternateWithASuccess() {
  console.log("Alternating with a success...")
  return succeedingPromise().then(afterSuccess, afterFail)
}

function follower(arg) {
  return new Promise(function(resolve, reject) {
    console.log("Afterwards..." + arg)
    resolve("Done")
  })
}

var promiseChain = alternateWithAFail()
  .then({}, afterFail)
  .then(follower)
  .then(alternateWithASuccess)
  .then(follower)
  .catch(reason => {
    console.log("Something happened: " + reason)
  })