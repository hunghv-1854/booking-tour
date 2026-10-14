import { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-exception-factory';

describe('validationExceptionFactory', () => {
  it('keys nested errors by their full path', () => {
    const errors = [
      {
        property: 'itineraries',
        children: [
          {
            property: '1',
            children: [
              {
                property: 'title',
                constraints: { isString: 'title must be a string' },
              },
            ],
          },
        ],
      },
      {
        property: 'price',
        constraints: { min: 'price must not be less than 0' },
      },
    ] as ValidationError[];

    const exception = validationExceptionFactory(errors);

    expect(exception.getStatus()).toBe(422);
    expect(exception.getResponse()).toEqual({
      errors: {
        'itineraries.1.title': ['title must be a string'],
        price: ['price must not be less than 0'],
      },
    });
  });
});
