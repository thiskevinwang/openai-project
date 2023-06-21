# CatGPT

```bash
# send vanilla message to model
BYPASS_CONTEXT=1 npm run start --silent "Who is Wilbur?"

# do some basic prompt crafting
BYPASS_CONTEXT=1 npm run start --silent "Using single words separated by periods, answer the question, Who is Wilbur?"

# leverage the context provided by ./documents/cat-alonia.md
npm run start --silent "What does Wilbur like to do?"

# log the crafted prompt
npm run start:with-prompt --silent "What does Wilbur like to do?
```
