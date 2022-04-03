let data = {
    "tomato": {
        "question": "{{keyAmount}} {{keyUnit}} {{name}} costs {{valueAmount}} {{valueUnit}}.",
        "answer": "It costs {{valueAmount}} {{valueUnit}}!",
        "name": "tomato",
        "valueType": "currency",
        "valueAmount": 20,
        "valueUnit": "rupees",
        "keyType": "weight",
        "keyAmount": 1,
        "keyUnit": "kg",
        "category": "groceries",
        "region": "in",
        "tolerance": 5
    }, 
    "million-to-lakhs" : {
        "question": "{{keyAmount}} {{keyUnit}} is {{valueAmount}} {{valueUnit}}.",
        "answer": "It's {{valueAmount}} {{valueUnit}}!",
        "valueType": "currency",
        "valueAmount": 10,
        "valueUnit": "lakhs",
        "keyType": "currency",
        "keyAmount": 1,
        "keyUnit": "million",
        "category": "units",
        "tolerance": 5
    }
}

export { data };