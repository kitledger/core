import { faker } from "@faker-js/faker";
import {
	UnitModel,
} from "./schema.ts";
import { BaseFactory } from "../base/base_factory.ts";

export class UnitFactory extends BaseFactory<UnitModel> {
	constructor() {
		super(makeUnitModel);
	}
}

const makeUnitModel = (): UnitModel => ({
	id: faker.string.uuid(),
	ref_id: faker.string.alphanumeric(6),
	name: faker.science.unit().name,
	alt_id: faker.datatype.boolean() ? faker.string.alphanumeric(8) : null,
	active: faker.datatype.boolean(),
	base_unit_id: faker.datatype.boolean() ? faker.string.uuid() : null,
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});
