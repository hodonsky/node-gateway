"use strict"

export const isContentValidType = ( type, obj ) => new Promise(( resolve, reject ) => {
  if ( type.isValid( obj, {
    noUndeclaredFields: true,
    /**
     * Handles errors in avro schema checking
     * @param { Array<string> } location - location of the error
     * @param { Object } errorBlock - The actual error block
     * @param { String } recordType - Expected AVRO type
     * @param { Object } record - The record
     */
    errorHook         : function( location, errorBlock, recordType ) {
      //console.log( arguments )
      // console.log( "=====Location====" )
      // console.log( location )
      // console.log( "=====ErrorBlock====" )
      // console.log( errorBlock )
      // console.log( "=====RecordType====" )
      // console.log( recordType, JSON.stringify( recordType.toJSON()))
      // console.log( "=====Record=====" )
      // console.log( record )
      const typeJSON = recordType.toJSON()
      const errBlock = {
        name     : "Transformer::isValid:avroErrorHook",
        status   : 500,
        userError: false
      }

      if ( typeJSON.fields ) {
        if ( typeof errorBlock === "object" ) {
          Object.keys( errorBlock ).every( fieldName => {
            if ( !typeJSON.fields.some( field => field.name === fieldName )) {
              reject({
                ...errBlock,
                message: location.length > 0 ?
                  `[${location.join( "." )}] - Field [${fieldName}] is not allowed` :
                  `Field [${fieldName}] is not allowed`
              })
              return false
            }
            return true
          })
          typeJSON.fields.every( field => {
            if ( typeof errorBlock[ field.name ] !== field.type ) {
              reject({
                ...errBlock,
                message: `For ${location[ location.length - 1 ]}.${field.name}, expected :${field.type}, got: ${typeof errorBlock[ field.name ]}`
              })
              return false
            }
            return true
          })
        } else {
          reject({
            ...errBlock,
            message: `Failed lookup. Likely does not exist or is undefined in response: [${location.join( "." )}]`
          })
        }
      } else {
        reject({
          ...errBlock,
          message: `For ${location.join( "." )}, expected: ${typeJSON}, got: ${typeof errorBlock}`
        })
      }
    }
  })
  ){
    resolve( true )
  }
})