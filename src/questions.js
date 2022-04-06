let data = {
    'tomato': {
        'question': '{{keyAmount}} {{keyUnit}} {{name}} costs {{valueAmount}} {{valueUnit}}.',
        'answer': 'It costs {{valueAmount}} {{valueUnit}}!',
        'name': 'tomato',
        'value': {
            'type': 'currency',
            'amount': 20,
            'unit': 'rupees',
        },
        'key' : {
            'type': 'weight',
            'amount': 1,
            'unit': 'kg',
        },
        'category': 'groceries',
        'region': 'in',
        'tolerance': 5
    }, 
    'million-to-lakhs' : {
        'question': '{{keyAmount}} {{keyUnit}} is {{valueAmount}} {{valueUnit}}.',
        'answer': 'It\'s {{valueAmount}} {{valueUnit}}!',
        'value': {
            'type': 'units',
            'amount': 10,
            'unit': 'lakhs',
        },
        'key' : {
            'type': 'units',
            'amount': 1,
            'unit': 'million',
        },
        'category': 'units',
        'tolerance': 5
    },
    'billion-to-crores' : {
        'question': '{{keyAmount}} {{keyUnit}} is {{valueAmount}} {{valueUnit}}.',
        'answer': 'It\'s {{valueAmount}} {{valueUnit}}!',
        'value': {
            'type': 'units',
            'amount': 100,
            'unit': 'crores',
        },
        'key' : {
            'type': 'units',
            'amount': 1,
            'unit': 'billion',
        },
        'category': 'units',
        'tolerance': 10
    },
    'indian-population' : {
        'question': 'Indian {{name}} as of 2020 is {{valueAmount}} {{valueUnit}}.',
        'answer': 'It\'s {{valueAmount}} {{valueUnit}}!',
        'name': 'poulation',
        'value': {
            'type': 'population',
            'amount': 138,
            'unit': 'crores',
        },
        'category': 'units',
        'tolerance': 20,
        'source': {
            'link': 'https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN',
            'title': 'Worldbank'
        }
    },
}

export { data };