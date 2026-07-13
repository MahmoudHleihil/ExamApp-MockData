export function validate(

    tool,

    args

){

    if(!tool.schema)

        return args;

    return tool.schema.parse(args);

}